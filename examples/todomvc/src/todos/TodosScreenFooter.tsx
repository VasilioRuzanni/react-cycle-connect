import React from 'react';
import classnames from 'classnames';
import {
  SHOW_ALL,
  SHOW_COMPLETED,
  SHOW_ACTIVE
} from '../constants/todoFilters';

const FILTER_TITLES = {
  [SHOW_ALL]: 'All',
  [SHOW_ACTIVE]: 'Active',
  [SHOW_COMPLETED]: 'Completed'
};

export function renderTodoCount(activeCount: number) {
  const itemWord = activeCount === 1 ? 'item' : 'items';

  return (
    <span className="todo-count">
      <strong>{activeCount || 'No'}</strong> {itemWord} left
    </span>
  );
}

interface FilterLinkProps {
  filter: string;
  selectedFilter: string;
  onSelect: (filter: string) => void;
}

export function FilterLink({
  filter,
  selectedFilter,
  onSelect
}: FilterLinkProps) {
  const title = FILTER_TITLES[filter];

  return (
    <a
      className={classnames({ selected: filter === selectedFilter })}
      style={{ cursor: 'pointer' }}
      onClick={() => onSelect(filter)}
    >
      {title}
    </a>
  );
}

interface ClearButtonProps {
  completedCount: number;
  onClearCompleted: () => void;
}

export function ClearButton({
  completedCount,
  onClearCompleted
}: ClearButtonProps) {
  return completedCount > 0 ? (
    <button className="clear-completed" onClick={onClearCompleted}>
      Clear completed
    </button>
  ) : null;
}

export interface Props {
  completedCount: number;
  activeCount: number;
  filter: string;
  onClearCompleted: () => void;
  onFilterChange: (filter: string) => void;
}

export function TodosScreenFooter({
  completedCount,
  activeCount,
  filter: selectedFilter,
  onFilterChange,
  onClearCompleted
}: Props) {
  return (
    <footer className="footer">
      {renderTodoCount(activeCount)}

      <ul className="filters">
        {[SHOW_ALL, SHOW_ACTIVE, SHOW_COMPLETED].map(filter => (
          <li key={filter}>
            <FilterLink
              filter={filter}
              selectedFilter={selectedFilter}
              onSelect={onFilterChange}
            />
          </li>
        ))}
      </ul>

      <ClearButton
        completedCount={completedCount}
        onClearCompleted={onClearCompleted}
      />
    </footer>
  );
}

export default TodosScreenFooter;
