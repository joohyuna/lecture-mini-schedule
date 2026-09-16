"use client";

import { CATEGORIES, type Category } from "../lib/types";
import type { UseDiary } from "../lib/useDiary";
import QuadrantCard from "./QuadrantCard";

interface Props {
  diary: UseDiary;
  selectedDate: string;
  readOnly: boolean;
  isFuture: boolean;
  onAdd: (category: Category) => void;
}

export default function Board({
  diary,
  selectedDate,
  readOnly,
  isFuture,
  onAdd,
}: Props) {
  return (
    <div className="flex flex-row flex-wrap gap-3 md:gap-4">
      {CATEGORIES.map((category) => {
        const items = diary.getItems(selectedDate, category);
        const priorDate = diary.latestPriorDate(selectedDate, category);
        const priorItems = priorDate ? diary.getItems(priorDate, category) : [];
        return (
          <QuadrantCard
            key={category}
            category={category}
            items={items}
            readOnly={readOnly}
            isFuture={isFuture}
            priorDate={priorDate}
            priorItems={priorItems}
            onAdd={onAdd}
            onToggle={diary.toggleStatus}
            onEdit={diary.editItem}
            onDelete={diary.deleteItem}
            onCarry={(c, ids) =>
              priorDate && diary.carryForward(priorDate, selectedDate, c, ids)
            }
          />
        );
      })}
    </div>
  );
}
