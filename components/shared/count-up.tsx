"use client";

import { useEffect, useState } from "react";

type Props = {
  value: number;
  formatter?: (value: number) => string;
  duration?: number;
  start?: boolean;
};

export function CountUp({
  value,
  formatter,
  duration = 800,
  start = false,
}: Props) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!start) return;

    let startValue = 0;
    const increment = value / (duration / 16);

    const counter = setInterval(() => {
      startValue += increment;

      if (startValue >= value) {
        setDisplayValue(value);
        clearInterval(counter);
      } else {
        setDisplayValue(Math.floor(startValue));
      }
    }, 16);

    return () => clearInterval(counter);
  }, [value, duration, start]);

  return <>{formatter ? formatter(displayValue) : displayValue}</>;
}