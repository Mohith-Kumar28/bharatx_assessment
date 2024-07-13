"use client";

import * as React from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import {
  ChevronDown,
  ChevronRight,
  File,
  Folder,
  FolderClosed,
  FolderOpen,
  MinusIcon,
  PlusIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

const Accordion = AccordionPrimitive.Root;

const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item ref={ref} className={cn("", className)} {...props} />
));
AccordionItem.displayName = "AccordionItem";

interface AccordionTriggerProps {
  isFolder?: boolean;
}
const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger> &
    AccordionTriggerProps
>(({ className, children, isFolder, ...props }, ref) => (
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn(
        "flex flex-1 items-start  gap-3 p-1 font-medium transition-all  group",
        className
      )}
      {...props}
    >
      {/* <div className="flex flex-col justify-center align-middle"> */}
      {isFolder ? (
        <>
          {" "}
          <ChevronRight className="h-4 w-4 shrink-0 ml-3 mt-[3px] transition-transform duration-200 group-data-[state=open]:rotate-90" />
          <FolderClosed className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:hidden" />
          <FolderOpen className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=closed]:hidden" />
        </>
      ) : (
        <File className="h-4 w-4 ml-6" />
      )}

      {/* <Folder className="h-4 w-4 shrink-0 ml-3 mt-[3px]  duration-200" /> */}

      {/* </div> */}
      {children}
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
));
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName;

const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className="overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
    {...props}
  >
    <div className={cn(" pt-0", className)}>{children}</div>
  </AccordionPrimitive.Content>
));

AccordionContent.displayName = AccordionPrimitive.Content.displayName;

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
