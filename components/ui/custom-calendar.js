import React, { useState } from "react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths, isSameMonth, isSameDay, isWithinInterval, isAfter, isBefore } from "date-fns";

const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CustomCalendar({ selected, onSelect }) {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(selected?.from || new Date()));
  const [range, setRange] = useState(selected || { from: null, to: null });

  const handleDayClick = (day) => {
    let newRange = { ...range };
    if (!range.from || (range.from && range.to)) {
      newRange = { from: day, to: null };
    } else if (isBefore(day, range.from)) {
      newRange = { from: day, to: range.from };
    } else {
      newRange = { from: range.from, to: day };
    }
    setRange(newRange);
    if (onSelect) onSelect(newRange);
  };

  const generateCalendar = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });
    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = "";

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, "d");
        const cloneDay = day;
        const isSelected =
          (range.from && isSameDay(day, range.from)) ||
          (range.to && isSameDay(day, range.to));
        const isInRange =
          range.from && range.to && isWithinInterval(day, { start: range.from, end: range.to });
        days.push(
          <button
            type="button"
            key={day}
            onClick={() => handleDayClick(cloneDay)}
            className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center transition-colors
              ${!isSameMonth(day, monthStart) ? "text-gray-400" : "text-gray-900"}
              ${isSelected ? "bg-blue-600 text-white" : isInRange ? "bg-blue-100 text-blue-800" : "hover:bg-blue-100"}`}
          >
            {formattedDate}
          </button>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div key={day} className="flex justify-between mb-2">
          {days}
        </div>
      );
      days = [];
    }
    return rows;
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md w-72">
      <div className="flex items-center justify-between mb-2">
        <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1 rounded hover:bg-gray-200">&#60;</button>
        <span className="font-semibold">{format(currentMonth, "MMMM yyyy")}</span>
        <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1 rounded hover:bg-gray-200">&#62;</button>
      </div>
      <div className="flex justify-between mb-1">
        {weekDays.map((day) => (
          <div key={day} className="w-8 text-center font-bold text-gray-700">{day}</div>
        ))}
      </div>
      <div>
        {generateCalendar()}
      </div>
    </div>
  );
} 