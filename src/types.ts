import { Dispatch, SetStateAction } from "react";

type ColumnType = "folder" | "todo" | "doing" | "done";

type CardType = {
  title: string;
  id: string;
  column: ColumnType;
};

type CardProps = CardType & {
  handleDragStart: Function;
};
type DropIndicatorProps = {
  beforeId: string | null;
  column: string;
};

type ColumnProps = {
  title: string;
  headingColor: string;
  cards: CardType[];
  column: ColumnType;
  setCards: Dispatch<SetStateAction<CardType[]>>;
};
