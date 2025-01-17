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
import { toast, useToast } from "./ui/use-toast";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";
import { ScrollArea } from "./ui/scroll-area";

const DragableList = () => {
  const [cards, setCards] = useState(DEFAULT_CARDS);

  return (
    <div className="flex  w-full gap-3  overflow-auto ">
      <div className="flex h-screen  gap-3 sticky top-0 left-0 bg-zinc-900 overflow-x-auto p-0">
        <FolderColumn
          title="BharatX folders"
          column="folder"
          headingColor="text-neutral-500"
          cards={cards}
          setCards={setCards}
        />
      </div>
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

const FolderColumn = ({
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
    const { element, isTargetDescendant } = getNearestIndicator(e, indicators);

    if (isTargetDescendant) {
      toast({
        variant: "destructive",
        title: "Uh oh! Can't move parent folder to child",
      });
      return;
    }
    const nearestChildCardId = element?.dataset.nearestchildcardid;
    let nearestChildCard = copy.find((c) => c.id === nearestChildCardId);
    let nearestParentCard = copy.find(
      (c) => c.id === nearestChildCard?.parentId
    );

    if (nearestChildCardId !== currentCard) {
      let cardToMove = copy.find((c) => c.id === currentCard);
      if (!cardToMove) return;
      console.log(cardToMove);
      // Update the column property based on the destination
      const newColumn = cardToMove.column; // Default to current column if not specified

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

      // Update parentId of the moved card
      cardToMove.parentId = nearestChildCard?.id;

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

  interface IndicatorResult {
    offset: number;
    element: HTMLElement;
    isTargetDescendant: boolean;
  }

  const getNearestIndicator = (
    e: React.DragEvent,
    indicators: HTMLElement[]
  ): IndicatorResult => {
    const el = indicators.reduce(
      (closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = e.clientY - (box.top + 50); // Adjust the distance offset as needed

        if (offset < 0 && offset > closest.offset) {
          return { offset: offset, element: child, isTargetDescendant: false };
        } else {
          return closest;
        }
      },
      {
        offset: Number.NEGATIVE_INFINITY,
        element: indicators[indicators.length - 1],
        isTargetDescendant: false,
      }
    );

    // Check if the target element is a descendant of the dragged item
    const isTargetDescendant = isDescendantOf(
      el.element.getAttribute("data-nearestchildcardid") || "",
      e.dataTransfer.getData("cardId") as string
    );

    return { ...el, isTargetDescendant }; // Return additional flag indicating if the target is a descendant
  };

  const isDescendantOf = (
    targetCardId: string,
    ancestorId: string
  ): boolean => {
    // Find the target card by its ID
    const targetCard = cards.find((c) => c.id === targetCardId);

    // Early return if the target card is not found
    if (!targetCard) return false;

    // Base case: If the target card has no parent, it cannot be a descendant of any other card.
    if (!targetCard.parentId) return false;

    // Check if the target card's parentId matches the ancestorId
    if (targetCard.parentId === ancestorId) {
      return true;
    }

    // Recursively call isDescendantOf on the parent card
    return isDescendantOf(targetCard.parentId, ancestorId);
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

  const rootNode = cards.find((c) => c.parentId == null);
  // const filteredCards = cards.filter((c) => c.column === column);

  const renderCardAndChildren = (card?: CardType): JSX.Element => {
    return (
      <>
        {/* <Accordion type="single" collapsible className="w-full"> */}
        {card && (
          <div className="relative">
            <Card
              key={card.id}
              {...card}
              cards={cards} // Pass the entire cards array to maintain the tree structure
              setCards={setCards}
              handleDragStart={handleDragStart}
              parentId={card.id}
              rootNode={true}
            />
          </div>
        )}{" "}
        {/* </Accordion> */}
      </>
    );
  };
  return (
    <div className=" shrink-0">
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
        className={` transition-colors ${
          active ? "bg-neutral-800/50" : "bg-neutral-800/0"
        }`}
      >
        {renderCardAndChildren(rootNode)}
        <DropIndicator beforeId={null} column={column} />
        {/* <AddCard cards={cards} column={column} setCards={setCards} /> */}
      </div>
    </div>
  );
};

interface CardProps extends Omit<CardType, "children"> {
  handleDragStart: (event: React.DragEvent, card: CardType) => void;
  children?: CardType[];
  cards: CardType[];
  rootNode?: boolean;
  setCards: React.Dispatch<React.SetStateAction<CardType[]>>;
}

const Card: React.FC<CardProps> = ({
  title,
  id,
  column,
  cards,
  setCards,
  parentId,
  rootNode,
  handleDragStart,
}) => {
  // Dynamically generate Tailwind CSS classes for padding and margin based on the depth
  // Assuming you have a way to determine the depth or simply using a fixed value for demonstration
  const indentClass = `pl-4`; // Example indentation, adjust as needed
  const headerIndentClass = `ml-4`; // Example indentation for the header, adjust as needed
  const children = cards.filter((card) => card.parentId === id);
  return (
    <>
      <div className="absolute z-0 w-full h-8 left-0 hover:bg-zinc-800  duration-300"></div>
      <div className="ml-4 relative z-10 ">
        <Accordion type="multiple">
          <AccordionItem className="" value={id}>
            <AccordionTrigger
              isFolder={column == "folder" ? true : false}
              draggable={rootNode ? "false" : "true"}
              className="cursor-grab"
              onDragStart={(e) =>
                handleDragStart(e as unknown as React.DragEvent, {
                  title,
                  id,
                  column,
                })
              }
            >
              <motion.div
                layout
                layoutId={id}
                className={`${
                  !rootNode && "  cursor-grab active:cursor-grabbing"
                } justify-between  flex gap-3 group relative pr-16 `}
              >
                <p className="text-sm text-neutral-100 ">{id}</p>
                {/* Only show the AddCard dropdown if the column is a folder */}
                {column === "folder" && (
                  <div className="hidden group-hover:block absolute z-50 right-2 bg-violet-400 rounded-md">
                    <AddCard cards={cards} parentId={id} setCards={setCards} />
                  </div>
                )}
              </motion.div>
            </AccordionTrigger>
            <DropIndicator beforeId={id} column={column} />

            <AccordionContent>
              {/* Content goes here */}
              {children.length > 0 &&
                children.map((child) => (
                  <Card
                    key={child.id}
                    {...child}
                    parentId={child.id} // Pass parentId to child
                    handleDragStart={handleDragStart}
                    cards={cards} // Pass cards down to child
                    setCards={setCards} // Pass setCards down to child
                  />
                ))}
              {children.length == 0 && (
                <div className=" pl-12 pb-1 text-gray-400 font-semibold">
                  no data{" "}
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </>
  );
};

type DropIndicatorProps = {
  beforeId: string | null;
  column: string;
};

const DropIndicator = ({ beforeId, column }: DropIndicatorProps) => {
  return (
    <div
      data-nearestchildcardid={beforeId || "-1"}
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
  column?: ColumnType;
  cards: CardType[];
  parentId?: string;
  setCards: Dispatch<SetStateAction<CardType[]>>;
};

const AddCard = ({ column, setCards, cards, parentId }: AddCardProps) => {
  const [text, setText] = useState("");
  const [adding, setAdding] = useState(false);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!text.trim().length) return;
    const existingCard = cards.find((card) => card.id === text);
    if (existingCard) {
      // Show an error message or alert to the user
      // alert("A card with this ID already exists.");
      toast({
        variant: "destructive",
        title: "A card with this name already exists.",
      });
      return;
    }

    const newCard = {
      column: column ?? "folder",
      title: text.trim(),
      id: text,
      parentId: parentId ?? "1",
    };

    setCards((pv) => [...pv, newCard]);

    setAdding(false);
  };

  return (
    <>
      {adding ? (
        <motion.form
          onMouseLeave={() => setAdding(false)}
          layout
          onSubmit={handleSubmit}
        >
          <textarea
            onChange={(e) => setText(e.target.value)}
            autoFocus
            placeholder="Add new folder..."
            className="w-full rounded border border-violet-400 bg-violet-400/20 p-3 text-sm text-grey-800 placeholder-violet-800 focus:outline-0"
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
              className="flex items-center gap-1.5 rounded bg-neutral-50 px-3 m-3 py-1.5 text-xs text-neutral-950 transition-colors hover:bg-neutral-300"
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
          className="flex  items-center gap-1.5 px-3 py-1.5 text-xs text-black transition-colors hover:text-grey-800"
        >
          {/* <span>Add folder</span> */}
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

  parentId?: string | null; // Optional parentId field
}

const DEFAULT_CARDS: CardType[] = [
  {
    title: "Main Dashboard",
    id: "Main Dashboard", // Using title as ID
    column: "folder",
    parentId: null,
  },
  {
    title: "Look into render bug in dashboard",
    id: "Look into render bug in dashboard", // Using title as ID
    column: "folder",
    parentId: "Main Dashboard", // Adjusted to match new ID format
  },
  {
    title: "SOX compliance checklist",
    id: "SOX compliance checklist", // Using title as ID
    column: "folder",
    parentId: "Main Dashboard", // Adjusted to match new ID format
  },
  {
    title: "Sub Main Dashboard",
    id: "Sub Main Dashboard", // Using title as ID
    column: "folder",
    parentId: "Look into render bug in dashboard", // Adjusted to match new ID format
  },
  {
    title: "Sub Look into render bug in dashboard",
    id: "Sub Look into render bug in dashboard", // Using title as ID
    column: "file",
    parentId: "Sub Main Dashboard", // Adjusted to match new ID format
  },
  {
    title: "Sub SOX compliance checklist 1",
    id: "Sub SOX compliance checklist 1", // Using title as ID
    column: "folder",
    parentId: "Sub Main Dashboard", // Adjusted to match new ID format
  },
];

export default DragableList;
