import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { format, addDays, subDays, isSameDay, startOfDay, addWeeks, subWeeks } from 'date-fns';

interface DateNavigatorProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  gameCountsByDate: Map<string, number>;
  daysToShow?: number;
}

const DateNavigator: React.FC<DateNavigatorProps> = ({ 
  selectedDate, 
  onDateChange,
  gameCountsByDate,
  daysToShow = 7
}) => {
  const today = startOfDay(new Date());
  
  // Track the window start date separately from selected date
  const [windowStart, setWindowStart] = useState<Date>(() => {
    // Initialize window centered on today
    return subDays(today, Math.floor(daysToShow / 2));
  });

  // Generate array of dates from window start
  const generateDates = () => {
    const dates: Date[] = [];
    for (let i = 0; i < daysToShow; i++) {
      dates.push(addDays(windowStart, i));
    }
    return dates;
  };

  const dates = generateDates();

  // Check if selected date is in current window
  const isDateInWindow = (date: Date) => {
    return dates.some(d => isSameDay(d, date));
  };

  // Handle date selection with smart window shifting
  const handleDateSelect = (date: Date) => {
    onDateChange(date);
    
    // Find index of clicked date in current window
    const clickedIndex = dates.findIndex(d => isSameDay(d, date));
    
    // If clicked date is in the first 2 positions, shift window left by 1
    if (clickedIndex === 0) {
      setWindowStart(subDays(windowStart, 1));
    }
    // If clicked date is in the last 2 positions, shift window right by 1
    else if (clickedIndex === daysToShow - 1) {
      setWindowStart(addDays(windowStart, 1));
    }
    // Otherwise, keep window as is
  };

  const getGameCount = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    return gameCountsByDate.get(dateKey) || 0;
  };

  // Single day navigation
  const handlePrevDay = () => {
    const newDate = subDays(selectedDate, 1);
    onDateChange(newDate);
    
    // If new date is before window, shift window left by 1
    if (!isDateInWindow(newDate)) {
      setWindowStart(subDays(windowStart, 1));
    }
  };

  const handleNextDay = () => {
    const newDate = addDays(selectedDate, 1);
    onDateChange(newDate);
    
    // If new date is after window, shift window right by 1
    if (!isDateInWindow(newDate)) {
      setWindowStart(addDays(windowStart, 1));
    }
  };

  // Week navigation
  const handlePrevWeek = () => {
    setWindowStart(subWeeks(windowStart, 1));
    onDateChange(subWeeks(selectedDate, 1));
  };

  const handleNextWeek = () => {
    setWindowStart(addWeeks(windowStart, 1));
    onDateChange(addWeeks(selectedDate, 1));
  };

  const handleToday = () => {
    onDateChange(today);
    // Center window on today
    setWindowStart(subDays(today, Math.floor(daysToShow / 2)));
  };

  return (
    <div className="date-navigator">
      <div className="date-nav-header">
        {/* Week Navigation */}
        <button 
          className="nav-week-btn" 
          onClick={handlePrevWeek}
          aria-label="Previous week"
          title="Previous week"
        >
          <ChevronsLeft size={20} />
        </button>

        {/* Day Navigation */}
        <button 
          className="nav-arrow-btn" 
          onClick={handlePrevDay}
          aria-label="Previous day"
          title="Previous day"
        >
          <ChevronLeft size={20} />
        </button>

        <button 
          className="today-btn"
          onClick={handleToday}
          disabled={isSameDay(selectedDate, today)}
        >
          Today
        </button>

        <button 
          className="nav-arrow-btn" 
          onClick={handleNextDay}
          aria-label="Next day"
          title="Next day"
        >
          <ChevronRight size={20} />
        </button>

        {/* Week Navigation */}
        <button 
          className="nav-week-btn" 
          onClick={handleNextWeek}
          aria-label="Next week"
          title="Next week"
        >
          <ChevronsRight size={20} />
        </button>
      </div>

      <div className="date-strip-container">
        <div className="date-strip">
          {dates.map((date, index) => {
            const isSelected = isSameDay(date, selectedDate);
            const isToday = isSameDay(date, today);
            const gameCount = getGameCount(date);

            return (
              <button
                key={format(date, 'yyyy-MM-dd')}
                className={`date-strip-item ${isSelected ? 'date-strip-item-selected' : ''} ${isToday ? 'date-strip-item-today' : ''}`}
                onClick={() => handleDateSelect(date)}
              >
                <div className="date-strip-day">{format(date, 'EEE')}</div>
                <div className="date-strip-date">{format(date, 'd')}</div>
                {gameCount > 0 && (
                  <div className="date-strip-count">{gameCount}</div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="selected-date-display">
        <h2>{format(selectedDate, 'EEEE, MMMM d, yyyy')}</h2>
      </div>
    </div>
  );
};

export default DateNavigator;

