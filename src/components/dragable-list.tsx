"use client";
import React, {
  Dispatch,
  SetStateAction,
  useState,
  DragEvent,
  FormEvent,
} from "react";
import { FiPlus, FiTrash } from "react-icons/fi";
import { motion } from "framer-motion";
import { FaFire } from "react-icons/fa";

const DragableList = () => {
  const [cards, setCards] = useState(DEFAULT_CARDS);

  return (
    <div className="flex h-full w-full gap-3 overflow-auto p-12">
      <Column
        title="Folders"
        column="folder"
        headingColor="text-neutral-500"
        cards={cards}
        setCards={setCards}
      />

      <BurnBarrel setCards={setCards} />
    </div>
  );
};

interface ColumnProps {
  title: string;
  headingColor: string;
  cards: CardType[];
  column: "folder" | "file"; // Assuming 'column' can only be 'folder' or 'file'
  setCards: React.Dispatch<React.SetStateAction<CardType[]>>;
}

const Column = ({
  title,
  headingColor,
  cards,
  column,
  setCards,
}: ColumnProps) => {
  const [active, setActive] = useState(false);

  const handleDragStart = (e: React.DragEvent, card: CardType) => {
    e.dataTransfer.setData("cardId", card.id);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    const cardId = e.dataTransfer.getData("cardId");
    setActive(false);
    clearHighlights();

    const indicators = getIndicators();
    const { element } = getNearestIndicator(e, indicators);

    const before = element?.dataset.before || "-1";

    if (before !== cardId) {
      let copy = [...cards];

      let cardToMove = copy.find((c) => c.id === cardId);
      if (!cardToMove) return;

      // Update the column property based on the destination
      const newColumn = element?.dataset.column || column; // Default to current column if not specified

      // Update the card's column property
      cardToMove = { ...cardToMove, column: newColumn as "folder" | "file" };

      // Find the destination folder
      const destinationFolder = copy.find((folder) => folder.id === before);
      if (!destinationFolder || destinationFolder.column !== "folder") {
        console.error("Destination is not a valid folder.");
        return;
      }

      // Remove the card from its current position
      copy = copy.filter((c) => c.id !== cardId);

      // Add the card to the destination folder's children
      destinationFolder.children = destinationFolder.children || [];
      destinationFolder.children.push(cardToMove);

      // Optionally, remove the card from its original parent's children if applicable
      const originalParent = cardToMove.parent;
      if (originalParent) {
        const index = originalParent?.children?.indexOf(cardToMove) || -1;
        if (index > -1) {
          if (index > -1) {
            originalParent.children?.splice(index, 1);
          }
        }

        setCards(copy);
      }
    }
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    highlightIndicator(e);

    setActive(true);
  };

  const clearHighlights = (els?: HTMLElement[]) => {
    const indicators = els || getIndicators();

    indicators.forEach((i) => {
      i.style.opacity = "0";
    });
  };

  const highlightIndicator = (e: DragEvent) => {
    const indicators = getIndicators();

    clearHighlights(indicators);

    const el = getNearestIndicator(e, indicators);

    el.element.style.opacity = "1";
  };

  const getNearestIndicator = (e: DragEvent, indicators: HTMLElement[]) => {
    const DISTANCE_OFFSET = 50;

    const el = indicators.reduce(
      (closest, child) => {
        const box = child.getBoundingClientRect();

        const offset = e.clientY - (box.top + DISTANCE_OFFSET);

        if (offset < 0 && offset > closest.offset) {
          return { offset: offset, element: child };
        } else {
          return closest;
        }
      },
      {
        offset: Number.NEGATIVE_INFINITY,
        element: indicators[indicators.length - 1],
      }
    );

    return el;
  };

  const getIndicators = () => {
    return Array.from(
      document.querySelectorAll(
        `[data-column="${column}"]`
      ) as unknown as HTMLElement[]
    );
  };

  const handleDragLeave = () => {
    clearHighlights();
    setActive(false);
  };

  const filteredCards = cards.filter((c) => c.column === column);

  return (
    <div className="w-56 shrink-0">
      <div className="mb-3 flex items-center justify-between">
        <h3 className={`font-medium ${headingColor}`}>{title}</h3>
        <span className="rounded text-sm text-neutral-400">
          {filteredCards.length}
        </span>
      </div>
      <div
        onDrop={handleDragEnd}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`h-full w-full transition-colors ${
          active ? "bg-neutral-800/50" : "bg-neutral-800/0"
        }`}
      >
        {cards.map((c) => (
          <Card key={c.id} {...c} handleDragStart={handleDragStart} />
        ))}
        <DropIndicator beforeId={null} column={column} />
        <AddCard column={column} setCards={setCards} />
      </div>
    </div>
  );
};

interface CardProps extends Omit<CardType, "children"> {
  handleDragStart: (event: React.DragEvent, card: CardType) => void;
  children?: CardType[]; // Add this line to include children in the props
}

const Card: React.FC<CardProps> = ({
  title,
  id,
  column,
  children,
  handleDragStart,
}) => {
  // Dynamically generate Tailwind CSS classes for padding and margin based on the depth
  // Assuming you have a way to determine the depth or simply using a fixed value for demonstration
  const indentClass = `pl-4`; // Example indentation, adjust as needed
  const headerIndentClass = `ml-4`; // Example indentation for the header, adjust as needed

  return (
    <div className="pl-4">
      <DropIndicator beforeId={id} column={column} />
      <motion.div
        layout
        layoutId={id}
        draggable="true"
        onDragStart={(e) =>
          handleDragStart(e as unknown as React.DragEvent, {
            title,
            id,
            column,
          })
        }
        className="cursor-grab rounded border border-neutral-700 bg-neutral-800 p-3 active:cursor-grabbing "
      >
        <p className="text-sm text-neutral-100 ">{title}</p>
      </motion.div>
      {children &&
        children.map((child) => (
          <Card key={child.id} {...child} handleDragStart={handleDragStart} />
        ))}
    </div>
  );
};

type DropIndicatorProps = {
  beforeId: string | null;
  column: string;
};

const DropIndicator = ({ beforeId, column }: DropIndicatorProps) => {
  return (
    <div
      data-before={beforeId || "-1"}
      data-column={column}
      className="my-0.5 h-0.5 w-full bg-violet-400 opacity-0"
    />
  );
};

const BurnBarrel = ({
  setCards,
}: {
  setCards: Dispatch<SetStateAction<CardType[]>>;
}) => {
  const [active, setActive] = useState(false);

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setActive(true);
  };

  const handleDragLeave = () => {
    setActive(false);
  };

  const handleDragEnd = (e: DragEvent) => {
    const cardId = e.dataTransfer.getData("cardId");

    setCards((pv) => pv.filter((c) => c.id !== cardId));

    setActive(false);
  };

  return (
    <div
      onDrop={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`mt-10 grid h-56 w-56 shrink-0 place-content-center rounded border text-3xl ${
        active
          ? "border-red-800 bg-red-800/20 text-red-500"
          : "border-neutral-500 bg-neutral-500/20 text-neutral-500"
      }`}
    >
      {active ? <FaFire className="animate-bounce" /> : <FiTrash />}
    </div>
  );
};

type AddCardProps = {
  column: ColumnType;
  setCards: Dispatch<SetStateAction<CardType[]>>;
};

const AddCard = ({ column, setCards }: AddCardProps) => {
  const [text, setText] = useState("");
  const [adding, setAdding] = useState(false);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!text.trim().length) return;

    const newCard = {
      column,
      title: text.trim(),
      id: Math.random().toString(),
    };

    setCards((pv) => [...pv, newCard]);

    setAdding(false);
  };

  return (
    <>
      {adding ? (
        <motion.form layout onSubmit={handleSubmit}>
          <textarea
            onChange={(e) => setText(e.target.value)}
            autoFocus
            placeholder="Add new task..."
            className="w-full rounded border border-violet-400 bg-violet-400/20 p-3 text-sm text-neutral-50 placeholder-violet-300 focus:outline-0"
          />
          <div className="mt-1.5 flex items-center justify-end gap-1.5">
            <button
              onClick={() => setAdding(false)}
              className="px-3 py-1.5 text-xs text-neutral-400 transition-colors hover:text-neutral-50"
            >
              Close
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded bg-neutral-50 px-3 py-1.5 text-xs text-neutral-950 transition-colors hover:bg-neutral-300"
            >
              <span>Add</span>
              <FiPlus />
            </button>
          </div>
        </motion.form>
      ) : (
        <motion.button
          layout
          onClick={() => setAdding(true)}
          className="flex w-full items-center gap-1.5 px-3 py-1.5 text-xs text-neutral-400 transition-colors hover:text-neutral-50"
        >
          <span>Add card</span>
          <FiPlus />
        </motion.button>
      )}
    </>
  );
};

type ColumnType = "folder" | "file";

interface CardType {
  title: string;
  id: string;
  column: "folder" | "file";
  children?: CardType[]; // Optional because a card can be a leaf node (file)
  parent?: CardType; // New property to reference the parent card
}

const DEFAULT_CARDS: CardType[] = [
  // FOLDER
  {
    title: "Main Dashboard",
    id: "1",
    column: "folder",
    children: [
      { title: "Look into render bug in dashboard", id: "1.1", column: "file" },
      { title: "SOX compliance checklist", id: "1.2", column: "file" },
      {
        title: "Sub Main Dashboard",
        id: "1.3",
        column: "folder",
        children: [
          {
            title: "Sub Look into render bug in dashboard",
            id: "1.31",
            column: "file",
          },
          { title: "Sub SOX compliance checklist", id: "1.32", column: "file" },
        ],
      },
    ],
  },
  { title: "[SPIKE] Migrate to Azure", id: "2", column: "folder" },
  { title: "Document Notifications service", id: "3", column: "folder" },
];

export default DragableList;
