import { SearchBar } from '@/components/ui/SearchBar';

type WorkerBrowseSearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  accessibilityLabel?: string;
  disabled?: boolean;
};

export function WorkerBrowseSearchBar(props: WorkerBrowseSearchBarProps) {
  return <SearchBar {...props} />;
}
