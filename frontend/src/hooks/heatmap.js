import React from "react";
import ReactDOM from "react-dom";
import CalendarHeatmap from "react-calendar-heatmap";
import { Tooltip as ReactTooltip } from 'react-tooltip'
import { heatmapdata } from "../heatmap_data";

import "../heatmap.css";

const today = new Date();

const heatmap = heatmapdata.reverse();

function Heatmap() {
  const data = getRange(365).map((index) => {
    return {
      date: shiftDate(today, -index),
      count: heatmap[index]
    };
  });
  return (
    <div>
      <CalendarHeatmap
        startDate={shiftDate(today, -365)}
        endDate={today}
        values={data}
        classForValue={(value) => {
          if (!value) {
            return "color-empty";
          }
          return `${value.count}` < 5
            ? `color-github-${value.count}`
            : `color-github-5`;
        }}
        tooltipDataAttrs={(value) => {
          return {
            "data-tip": `${
              value.count
            } submissions on ${value.date.toString().slice(4, 15)}`
          };
        }}
        showWeekdayLabels={false}
      />
      <ReactTooltip />
    </div>
  );
}

function shiftDate(date, numDays) {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() + numDays);
  return newDate;
}

function getRange(count) {
  return Array.from({ length: count }, (_, i) => i);
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export default Heatmap;
