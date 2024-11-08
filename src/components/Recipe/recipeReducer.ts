import { OmitStrict } from "@/utils/types";
import { RecipeQueryResult } from "../../../sanity.types";
import {
  RecipeIngredient,
  RecipeIngredients,
  RecipeInstructions,
} from "./types";
import { produce } from "immer";
import { isDefined } from "@/utils/tsUtils";

export const minServings = 1;
export const maxServings = 999;

type IngredientsGroupOrder = Array<string>;

type IngredientsCompletionState = {
  [ingredientId: string]: {
    [recipeIngredientKey: string]: {
      completed: boolean;
    };
  };
};

export type RecipeIngredientState = {
  ingredientId: string;
  name: string;
  group: string | null;
  percent?: number;
  amount?: number;
  unit?: RecipeIngredient["unit"];
  comment?: RecipeIngredient["comment"];
};

type RecipeIngredientsState = Array<RecipeIngredientState>;

export type RecipeState = {
  recipeRevision: string;
  initialServings: number;
  servings: number;
  ingredientsCompletion: IngredientsCompletionState;
  ingredientsGroupOrder: IngredientsGroupOrder;
  ingredients: RecipeIngredientsState;
  yieldPerServing: number;
};

export const calcIngredientAmount = (
  percent: number | null | undefined,
  baseIngredientsAmount: number,
): number | undefined =>
  percent ? baseIngredientsAmount * (percent / 100) : undefined;

export const calcInitialIngredientsCompletionState = (
  instructions: RecipeInstructions | null | undefined,
): IngredientsCompletionState => {
  if (!instructions) {
    return {};
  }

  return instructions
    .filter((i) => i._type === "block")
    .reduce<IngredientsCompletionState>((state, instruction) => {
      const ingredientReferences = instruction.children
        ?.filter((x) => x._type === "recipeIngredientReference")
        .filter((x) => x.hideCheckbox !== true);

      ingredientReferences?.forEach((recipeInstruction) => {
        const ingredientId = recipeInstruction.ingredient?._id;
        if (!ingredientId) {
          return;
        }

        if (!state[ingredientId]) {
          state[ingredientId] = {};
        }

        const recipeInstructionKey = recipeInstruction._key;
        state[ingredientId][recipeInstructionKey] = {
          completed: false,
        };
      });

      return state;
    }, {});
};

export const isIngredientComplete = (
  ingredientsCompletion: IngredientsCompletionState,
  ingredientId: string,
) => {
  const ingredient = ingredientsCompletion[ingredientId];

  if (!ingredient) {
    return false;
  }

  return Object.values(ingredient).every((x) => x.completed);
};

const resetIngredientsCompletionState = (
  ingredientsCompletionState: IngredientsCompletionState,
  completed: boolean,
): IngredientsCompletionState => {
  return produce(ingredientsCompletionState, (draft) => {
    Object.keys(draft).forEach((ingredientId) => {
      const recipeIngredients = draft[ingredientId];
      Object.keys(recipeIngredients).forEach((recipeIngredientKey) => {
        recipeIngredients[recipeIngredientKey].completed = completed;
      });
    });
  });
};

const mapIngredientReferenceToIngredient = (
  baseDryIngredients: number,
  group: string | null,
  ingredientRef: OmitStrict<RecipeIngredient, "_type"> | null,
): RecipeIngredientState | null => {
  const { _id, ingredient, percent, unit, comment } = ingredientRef ?? {};

  if (!_id || !ingredient || !ingredient.name) {
    return null;
  }

  return {
    ingredientId: _id,
    name: ingredient.name,
    percent: percent ?? undefined,
    group: group,
    amount: calcIngredientAmount(percent, baseDryIngredients) ?? undefined,
    unit: unit,
    comment: comment,
  };
};

const calcInitialRecipeIngredientsState = (
  baseDryIngredients: number,
  recipeIngredientsQueryResult: RecipeIngredients | null | undefined,
): [IngredientsGroupOrder, RecipeIngredientsState] => {
  const groupOrder: IngredientsGroupOrder = [];

  const ingredientsState =
    recipeIngredientsQueryResult
      ?.map((ingredientRef) => {
        if (ingredientRef?._type === "reference") {
          return [
            mapIngredientReferenceToIngredient(
              baseDryIngredients,
              null,
              ingredientRef,
            ),
          ];
        } else if (
          ingredientRef.title != null &&
          (ingredientRef.ingredients?.length ?? 0) > 0
        ) {
          groupOrder.push(ingredientRef.title);

          return ingredientRef.ingredients?.map((ingredient) =>
            mapIngredientReferenceToIngredient(
              baseDryIngredients,
              ingredientRef.title,
              ingredient,
            ),
          );
        }
      })
      .flat()
      .filter((r) => r != null) ?? [];

  return [groupOrder, ingredientsState];
};

export type RecipeAction =
  | {
      type: "onIngredientReferenceCompletionChange";
      payload: {
        ingredientId: string;
        ingredientReferenceKey: string;
      };
    }
  | {
      type: "onIngredientCompletionChange";
      payload: {
        ingredientId: string;
        completed: boolean;
      };
    }
  | {
      type: "onAllIngredientsCompletionChange";
      payload: {
        group: string | null;
        completed: boolean;
      };
    }
  | {
      type: "onServingsChange";
      payload: number;
    }
  | {
      type: "onIngredientChange";
      payload: {
        ingredientId: string;
        newAmount: number;
      };
    }
  | { type: "reset"; payload: RecipeState };

export const calcInitialState = (
  recipe: NonNullable<RecipeQueryResult>,
): RecipeState => {
  const { _rev, servings, instructions, ingredients, baseDryIngredients } =
    recipe;

  const initialServingsNum = servings ?? 1;
  const initialDryIngredients = baseDryIngredients ?? 1000;

  const [groupOrder, ingredientsState] = calcInitialRecipeIngredientsState(
    initialDryIngredients,
    ingredients,
  );

  const totalYield = ingredientsState.reduce(
    (acc, curr) => acc + (curr?.amount ?? 0),
    0,
  );

  return {
    recipeRevision: _rev,
    initialServings: initialServingsNum,
    servings: initialServingsNum,
    ingredientsGroupOrder: groupOrder,
    ingredientsCompletion: calcInitialIngredientsCompletionState(instructions),
    ingredients: ingredientsState,
    yieldPerServing: totalYield / initialServingsNum,
  };
};

export const recipeReducer = (
  state: RecipeState,
  action: RecipeAction,
): RecipeState => {
  switch (action.type) {
    case "onIngredientReferenceCompletionChange": {
      const { ingredientId, ingredientReferenceKey } = action.payload;

      return produce(state, (draft) => {
        const currentIngredient = draft.ingredientsCompletion[ingredientId];
        const currentKeyStatus =
          currentIngredient[ingredientReferenceKey]?.completed ?? false;

        currentIngredient[ingredientReferenceKey] = {
          completed: !currentKeyStatus,
        };
      });
    }
    case "onIngredientCompletionChange": {
      const { ingredientId, completed } = action.payload;

      return produce(state, (draft) => {
        const currentIngredient = draft.ingredientsCompletion[ingredientId];

        Object.keys(currentIngredient).forEach((recipeIngredientKey) => {
          currentIngredient[recipeIngredientKey].completed = completed;
        });
      });
    }
    case "onAllIngredientsCompletionChange": {
      return produce(state, (draft) => {
        const { group, completed } = action.payload;

        const ingredientsToUpdate = draft.ingredients.filter(
          (i) => i.group === group,
        );

        ingredientsToUpdate.forEach((ingredient) => {
          const ingredientCompletion =
            draft.ingredientsCompletion[ingredient.ingredientId];

          Object.keys(ingredientCompletion).forEach((recipeIngredientKey) => {
            ingredientCompletion[recipeIngredientKey].completed = completed;
          });
        });
      });
    }
    case "onServingsChange": {
      const newServings = action.payload;

      if (
        newServings === 0 ||
        isNaN(newServings) ||
        newServings < minServings ||
        newServings >= maxServings
      ) {
        return state;
      }

      const changePercent = newServings / state.servings;

      return produce(state, (draft) => {
        draft.servings = newServings;

        draft.ingredients.forEach((ingredient) => {
          if (isDefined(ingredient.amount)) {
            ingredient.amount *= changePercent;
          }
        });

        draft.ingredientsCompletion = resetIngredientsCompletionState(
          draft.ingredientsCompletion,
          false,
        );
      });
    }
    case "onIngredientChange": {
      const { newAmount, ingredientId } = action.payload;

      if (newAmount === 0 || isNaN(newAmount)) {
        return state;
      }

      return produce(state, (draft) => {
        const ingredientToUpdate = draft.ingredients.find(
          (ingredient) => ingredient.ingredientId === ingredientId,
        );

        if (!ingredientToUpdate) {
          return;
        }

        const updatedIngredientPercent = ingredientToUpdate.percent;

        draft.ingredients.forEach((ingredient) => {
          if (ingredient.ingredientId === ingredientId) {
            ingredient.amount = newAmount;
          } else if (
            isDefined(ingredient.percent) &&
            isDefined(updatedIngredientPercent)
          ) {
            ingredient.amount =
              (ingredient.percent / updatedIngredientPercent) * newAmount;
          }
        });

        const updatedTotalYield = draft.ingredients.reduce(
          (acc, curr) => acc + (curr.amount ?? 0),
          0,
        );

        draft.servings = updatedTotalYield / draft.yieldPerServing;

        draft.ingredientsCompletion = resetIngredientsCompletionState(
          draft.ingredientsCompletion,
          false,
        );
      });
    }
    case "reset":
      return action.payload;
    default:
      return state;
  }
};
