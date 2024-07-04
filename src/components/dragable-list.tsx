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
  column: "folder" | "file"; // Assuming 'column' can only be 'folder' or 'file'
  cards: CardType[];
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
    let copy = [...cards];
    const currentCard = e.dataTransfer.getData("cardId");
    setActive(false);
    clearHighlights();

    const indicators = getIndicators();
    const { element } = getNearestIndicator(e, indicators);

    const nearestChildCardId = element?.dataset.nearestchildcardid;
    let nearestChildCard = copy.find((c) => c.id === nearestChildCardId);
    let nearestParentCard = copy.find(
      (c) => c.id === nearestChildCard?.parentId
    );

    if (nearestChildCardId !== currentCard) {
      let cardToMove = copy.find((c) => c.id === currentCard);
      if (!cardToMove) return;

      // Update the column property based on the destination
      const newColumn = element?.dataset.column || column; // Default to current column if not specified

      // Update the card's column property
      cardToMove = { ...cardToMove, column: newColumn as "folder" | "file" };

      copy = copy.filter((c) => c.id !== currentCard);

      const moveToBack = nearestChildCardId === "-1";
      if (moveToBack) {
        copy.push(cardToMove);
      } else {
        const insertAtIndex = copy.findIndex(
          (el) => el.id === nearestChildCardId
        );
        if (insertAtIndex === -1) return;

        copy.splice(insertAtIndex, 0, cardToMove);
      }

      // Update childrenIds and parentId of the moved card
      cardToMove.childrenIds = nearestChildCardId ? [nearestChildCardId] : [];
      cardToMove.parentId = nearestParentCard?.id;

      // Update childrenIds of the new parent card
      if (
        nearestParentCard &&
        !nearestParentCard.childrenIds?.includes(currentCard)
      ) {
        nearestParentCard.childrenIds = nearestParentCard.childrenIds?.concat([
          currentCard,
        ]);
      }

      console.log(copy);

      setCards(copy);
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

  const rootNode = cards.find((c) => c.column === "root");
  // const filteredCards = cards.filter((c) => c.column === column);

  const renderCardAndChildren = (card?: CardType): JSX.Element => {
    return (
      <>
        {card && (
          <Card
            key={card.id}
            {...card}
            cards={cards} // Pass the entire cards array to maintain the tree structure
            setCards={setCards}
            handleDragStart={handleDragStart}
            childrenIds={card.childrenIds} // Pass childrenIds as a prop
          />
        )}{" "}
      </>
    );
  };
  return (
    <div className="w-56 shrink-0">
      <div className="mb-3 flex items-center justify-between">
        <h3 className={`font-medium ${headingColor}`}>{title}</h3>
        <span className="rounded text-sm text-neutral-400">
          {/* {filteredCards.length} */}
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
        {renderCardAndChildren(rootNode)}
        <DropIndicator beforeId={null} column={column} />
        <AddCard column={column} setCards={setCards} />
      </div>
    </div>
  );
};

interface CardProps extends Omit<CardType, "children"> {
  handleDragStart: (event: React.DragEvent, card: CardType) => void;
  children?: CardType[];
  cards: CardType[];
  setCards: React.Dispatch<React.SetStateAction<CardType[]>>;
}

const Card: React.FC<CardProps> = ({
  title,
  id,
  column,
  cards,
  setCards,
  childrenIds,
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
        <p className="text-sm text-neutral-100 ">{id}</p>
      </motion.div>

      {childrenIds &&
        childrenIds.length > 0 &&
        childrenIds.map((childId) => {
          const child = cards.find((card) => card.id === childId);

          return child ? (
            <Card
              key={child.id}
              {...child}
              childrenIds={child.childrenIds}
              handleDragStart={handleDragStart}
              cards={cards} // Pass cards down to child
              setCards={setCards} // Pass setCards down to child
            />
          ) : null;
        })}
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
      data-nearestChildCardId={beforeId || "-1"}
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
  id: string; // Ensure this is always an integer
  column: string;
  childrenIds?: string[];
  parentId?: string | null; // Optional parentId field
}

const DEFAULT_CARDS: CardType[] = [
  {
    title: "Main Dashboard",
    id: "1",
    column: "root",
    childrenIds: ["11", "12"],
    parentId: null, // Root element has no parent
  },
  {
    title: "Look into render bug in dashboard",
    id: "11",
    column: "folder",
    childrenIds: ["13"],
    parentId: "1", // Child of "Main Dashboard"
  },
  {
    title: "SOX compliance checklist",
    id: "12",
    column: "folder",
    childrenIds: [],
    parentId: "1", // Child of "Main Dashboard"
  },
  {
    title: "Sub Main Dashboard",
    id: "13",
    column: "folder",
    childrenIds: ["131", "132"],
    parentId: "11", // Child of "Look into render bug in dashboard"
  },
  {
    title: "Sub Look into render bug in dashboard",
    id: "131",
    column: "file",
    childrenIds: [],
    parentId: "13", // Child of "Sub Main Dashboard"
  },
  {
    title: "Sub SOX compliance checklist",
    id: "132",
    column: "folder",
    childrenIds: [],
    parentId: "13", // Child of "Sub Main Dashboard"
  },
];

export default DragableList;
