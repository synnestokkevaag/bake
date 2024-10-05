"use client";

import { RecipeQueryResult } from "../../../sanity.types";
import Image from "next/image";
import { urlFor } from "@/sanity/lib/image";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { TypographyH1 } from "../Typography/TypographyH1";
import { Button } from "../ui/button";
import { TypographyP } from "../Typography/TypographyP";
import { WakeLockToggle } from "./WakeLockToggle";
import { RecipeEditor } from "./RecipeEditor";
import { useRecipeContext } from "./recipeContext";
import { calcInitialState, isIngredientComplete } from "./recipeReducer";
import { RecipeIngredientReferenceResult } from "./RecipeIngredientReference/RecipeIngredientReference";
import { recipeIngredientReferenceType } from "@/sanity/schemaTypes/recipeIngredientReference";
import {
  RecipeIngredientReference,
  ScalableRecipeNumber as ScalableRecipeNumberType,
} from "./types";
import { ComponentProps } from "react";
import { PortableText } from "../PortableText/PortableText";
import { formatAmount } from "@/utils/recipeUtils";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { InfoCircledIcon } from "@radix-ui/react-icons";
import { scalableRecipeNumberType } from "@/sanity/schemaTypes/scalableRecipeNumberType";
import { ScalableRecipeNumber } from "./ScalableRecipeNumber";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";

const types: ComponentProps<typeof PortableText>["types"] = {
  [recipeIngredientReferenceType.name]: ({
    value,
  }: {
    value: RecipeIngredientReference | null | undefined;
  }) => {
    if (!value) return null;

    return <RecipeIngredientReferenceResult value={value} />;
  },
  [scalableRecipeNumberType.name]: ({
    value,
  }: {
    value: ScalableRecipeNumberType | null | undefined;
  }) => {
    if (!value) return null;

    return <ScalableRecipeNumber value={value} />;
  },
};

const block: ComponentProps<typeof PortableText>["block"] = {
  normal: ({ children }) => (
    <TypographyP className="leading-7">{children}</TypographyP>
  ),
};

type RecipeContentProps = {
  recipe: NonNullable<RecipeQueryResult>;
};

export const RecipeContent = ({ recipe }: RecipeContentProps) => {
  const { title, mainImage, instructions } = recipe;

  const {
    ingredients,
    ingredientsCompletion,
    servings,
    initialServings,
    dispatch,
  } = useRecipeContext();

  const reset = () => {
    dispatch({
      type: "reset",
      payload: calcInitialState(recipe),
    });
  };

  const scaleFactor = 100 * (servings / initialServings);

  const ingredientsCompletionValues = Object.values(ingredientsCompletion);

  const anyIngredientsComplete = ingredientsCompletionValues.some((c) =>
    Object.values(c).some((c) => c.completed),
  );

  const allIngredientsComplete = ingredientsCompletionValues.every((c) =>
    Object.values(c).every((c) => c.completed),
  );

  return (
    <main className="px-6">
      <div className="prose-lg prose container mx-auto flex max-w-5xl flex-col gap-8 pt-8 sm:pt-12">
        {title ? (
          <TypographyH1 className="text-center sm:mb-8">{title}</TypographyH1>
        ) : null}
        {mainImage?.asset?._ref && (
          <Image
            className="w-full rounded-lg"
            src={urlFor(mainImage.asset._ref).width(2000).height(800).url()}
            width={1000}
            height={400}
            alt={title || ""}
            priority={true}
          />
        )}
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12 md:gap-8">
          <div className="col-span-full flex flex-col gap-4 md:col-span-4">
            <WakeLockToggle />

            <div className="flex flex-wrap gap-2">
              <RecipeEditor onReset={reset} />
              <Button type="button" variant="outline" onClick={reset}>
                Tilbakestill
              </Button>
            </div>

            <TypographyP className="!mt-0">
              Antall:{" "}
              <span className="font-bold">{formatAmount(servings)}</span>
            </TypographyP>

            {ingredients ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="inline-flex items-center">
                      <Checkbox
                        checked={
                          anyIngredientsComplete && !allIngredientsComplete
                            ? "indeterminate"
                            : allIngredientsComplete
                        }
                        onCheckedChange={(checked) => {
                          if (checked === "indeterminate") {
                            dispatch({
                              type: "onAllIngredientsCompletionChange",
                              payload: true,
                            });
                          } else {
                            dispatch({
                              type: "onAllIngredientsCompletionChange",
                              payload: checked,
                            });
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead>Ingrediens</TableHead>
                    <TableHead>Prosent</TableHead>
                    <TableHead>Mengde</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ingredients.map(
                    ({ ingredientId, name, percent, amount, unit }) => {
                      const isComplete = isIngredientComplete(
                        ingredientsCompletion,
                        ingredientId,
                      );

                      const checkboxId = `ingredient-${ingredientId}-complete`;

                      return (
                        <TableRow key={ingredientId}>
                          <TableCell className="flex items-center">
                            <Checkbox
                              id={checkboxId}
                              checked={isComplete}
                              onCheckedChange={(checked) => {
                                if (checked === "indeterminate") return;

                                dispatch({
                                  type: "onIngredientCompletionChange",
                                  payload: {
                                    ingredientId,
                                    completed: checked,
                                  },
                                });
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Label
                              htmlFor={checkboxId}
                              className="hover:cursor-pointer"
                            >
                              {name}
                            </Label>
                          </TableCell>
                          <TableCell>{formatAmount(percent, 1)}%</TableCell>
                          <TableCell>
                            {formatAmount(amount)} {unit}
                          </TableCell>
                        </TableRow>
                      );
                    },
                  )}
                </TableBody>
              </Table>
            ) : null}
          </div>
          <div className="col-span-full align-baseline md:col-span-8">
            {scaleFactor !== 100 && (
              <Alert>
                <InfoCircledIcon />
                <AlertTitle>Skalert oppskrift</AlertTitle>
                <AlertDescription>
                  Denne oppskriften er skalert {formatAmount(scaleFactor, 0)}% i
                  forhold til original oppskrift. Ta kontakt hvis oppskriften
                  ikke gir mening eller noen av ingrediensene ikke blir riktig
                  skalert.
                </AlertDescription>
              </Alert>
            )}

            {instructions ? (
              <PortableText value={instructions} block={block} types={types} />
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
};
