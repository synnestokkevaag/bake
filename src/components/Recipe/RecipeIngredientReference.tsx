import { RecipeIngredientReference } from "./types";
import { useRecipeContext } from "./recipeContext";
import { formatAmount } from "@/utils/recipeUtils";
import { HighlightWithCheckbox } from "@/components/PortableText/HighlightWithCheckbox";
import { isDefined } from "@/utils/tsUtils";
import { Highlight } from "../PortableText/Highlight";

type RecipeIngredientReferenceResultProps = {
  value: NonNullable<RecipeIngredientReference>;
};

export const RecipeIngredientReferenceResult = ({
  value,
}: RecipeIngredientReferenceResultProps) => {
  const { ingredients, ingredientsCompletion, dispatch } = useRecipeContext();

  if (!value.ingredient || !value.ingredient._id) {
    return null;
  }

  const { percentage: referencePercentage, hideCheckbox } = value;

  const { _id, name, unit } = value.ingredient;

  const ingredientState = ingredients.find((i) => i.ingredientId === _id);

  const mappedAmount =
    isDefined(ingredientState?.amount) && isDefined(referencePercentage)
      ? ingredientState.amount * (referencePercentage / 100)
      : null;

  const amountLabel = isDefined(mappedAmount)
    ? `${formatAmount(mappedAmount, unit)} `
    : "";

  const labelText = `${amountLabel}${name}`;

  return hideCheckbox ? (
    <Highlight>{labelText}</Highlight>
  ) : (
    <HighlightWithCheckbox
      checked={ingredientsCompletion[_id]?.[value._key]?.completed ?? false}
      title={`Marker ${labelText?.toLowerCase() ?? "ingrediensen"} som fullført`}
      onCheckedChange={() =>
        dispatch({
          type: "onIngredientReferenceCompletionChange",
          payload: {
            ingredientId: _id,
            ingredientReferenceKey: value._key,
          },
        })
      }
    >
      {labelText}
    </HighlightWithCheckbox>
  );
};
