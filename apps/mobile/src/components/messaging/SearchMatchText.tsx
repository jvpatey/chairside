import { Text, type TextStyle } from 'react-native';

type SearchMatchTextProps = {
  text: string;
  query: string;
  style?: TextStyle;
  highlightStyle?: TextStyle;
  numberOfLines?: number;
};

/** Renders text with the first case-insensitive query match emphasized (Apple Messages style). */
export function SearchMatchText({
  text,
  query,
  style,
  highlightStyle,
  numberOfLines,
}: SearchMatchTextProps) {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) {
    return (
      <Text style={style} numberOfLines={numberOfLines}>
        {text}
      </Text>
    );
  }

  const lowerText = text.toLowerCase();
  const lowerQuery = trimmedQuery.toLowerCase();
  const matchIndex = lowerText.indexOf(lowerQuery);

  if (matchIndex === -1) {
    return (
      <Text style={style} numberOfLines={numberOfLines}>
        {text}
      </Text>
    );
  }

  const before = text.slice(0, matchIndex);
  const match = text.slice(matchIndex, matchIndex + trimmedQuery.length);
  const after = text.slice(matchIndex + trimmedQuery.length);

  return (
    <Text style={style} numberOfLines={numberOfLines}>
      {before}
      <Text style={highlightStyle}>{match}</Text>
      {after}
    </Text>
  );
}
