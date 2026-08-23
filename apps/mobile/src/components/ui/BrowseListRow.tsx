import type { ReactNode } from 'react';
import type { TextStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { cardShellRadii } from '@/components/ui/cardLayout';
import { CardSectionDivider } from '@/components/ui/CardTitleSection';
import { ListingMetaIconRow } from '@/components/ui/ListingMetaIconRow';
import type { ListingMetaRow } from '@/lib/listingCardDisplay';
import { webHover, webListRowHoverStyles, webOnlyStyle, webPointer } from '@/lib/webPressableStyles';
import { useTheme, useThemedStyles } from '@/theme';
import { radii } from '@/theme/tokens';

export type ListingLayout = 'tile' | 'list';

function renderPostedLabel(
  label: string | ReactNode,
  style: TextStyle | TextStyle[],
  numberOfLines = 1,
) {
  if (typeof label === 'string') {
    return (
      <Text style={style} numberOfLines={numberOfLines}>
        {label}
      </Text>
    );
  }
  return label;
}

type BrowseListRowProps = {
  avatar: ReactNode;
  eyebrow?: string | null;
  /** Geographic place line (city, province) shown below the eyebrow. */
  location?: string | null;
  title: string;
  /** Renders below title (e.g. clinic name with icon). */
  subtitle?: ReactNode;
  meta?: string | null;
  detail?: string | null;
  postedLabel?: string | ReactNode | null;
  /** Icon meta lines in the split content band (replaces detail/posted/meta when set). */
  metaRows?: ListingMetaRow[];
  /** Where `postedLabel` appears in split layout. Default `content` (tinted band). */
  postedLabelPlacement?: 'header' | 'content';
  /** Split header: secondary line below location (e.g. role type). */
  headerDetail?: string | null;
  /** Split header: accent line (e.g. wage). */
  headerAccent?: string | null;
  /** Renders below the text block, aligned with the title column. */
  textFooter?: ReactNode;
  /** Renders on its own line at the bottom of the card content. */
  /** Renders below the row; use with `statusFooterAlign`. */
  statusFooter?: ReactNode;
  statusFooterAlign?: 'start' | 'end';
  /** Renders in the top-right of the header row. */
  topTrailing?: ReactNode;
  trailing?: ReactNode;
  /** Renders on the right of the split content block, vertically centered. */
  contentAccessory?: ReactNode;
  footer?: ReactNode;
  /** Split layout: renders below the header, outside the tinted content band. */
  action?: ReactNode;
  onPress?: () => void;
  showChevron?: boolean;
  /** Tighter padding and type for phone dashboard rows. */
  compact?: boolean;
  /** Stacked layout: hairline between title and meta/detail block. */
  detailsDivider?: boolean;
  /** `split` — header above a tinted content band (matches tile cards). */
  layout?: 'stacked' | 'split';
  /** When `header`, only the header block is pressable with inset hover (for rows with external footers). */
  pressScope?: 'row' | 'header';
  /** Skip outer row padding when the parent shell already provides inset. */
  paddingless?: boolean;
};

export function BrowseListRow({
  avatar,
  eyebrow,
  location,
  title,
  subtitle,
  meta,
  detail,
  postedLabel,
  metaRows,
  postedLabelPlacement = 'content',
  headerDetail,
  headerAccent,
  textFooter,
  statusFooter,
  statusFooterAlign = 'start',
  topTrailing,
  trailing,
  contentAccessory,
  footer,
  action,
  onPress,
  showChevron = true,
  compact = false,
  detailsDivider = false,
  layout = 'split',
  pressScope = 'row',
  paddingless = false,
}: BrowseListRowProps) {
  const { colors } = useTheme();
  const isSplit = layout === 'split';
  const usesMetaRows = Boolean(metaRows?.length);
  const postedInHeader = isSplit && postedLabelPlacement === 'header' && postedLabel && !usesMetaRows;
  const postedInContent = postedLabel && !postedInHeader && !usesMetaRows;
  const hasContentSection =
    isSplit &&
    Boolean(
      usesMetaRows ||
      detail ||
      postedInContent ||
      textFooter ||
      footer ||
      trailing ||
      contentAccessory,
    );

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    container: {
      paddingVertical: compact ? spacing.sm : spacing.md,
      paddingHorizontal: compact ? spacing.sm : spacing.md,
      gap: spacing.xs,
      position: 'relative',
      overflow: 'hidden',
    },
    containerPaddingless: {
      paddingVertical: 0,
      paddingHorizontal: 0,
    },
    rowHovered: webListRowHoverStyles(colors),
    rowPressed: {
      backgroundColor: colors.fillSubtle,
    },
    headerPressTarget: {
      borderRadius: radii.sm,
      paddingVertical: spacing.xs,
      ...webPointer(),
      ...webOnlyStyle({
        transitionProperty: 'background-color, box-shadow',
        transitionDuration: '140ms',
      } as const),
    },
    headerHovered: {
      backgroundColor: colors.fillSubtle,
      ...webOnlyStyle({
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
      } as const),
    },
    headerPressed: {
      backgroundColor: colors.fillSubtle,
      opacity: 0.92,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
    },
    headerBody: {
      flex: 1,
      minWidth: 0,
      gap: spacing.xs,
    },
    headerBodyCornerInset: {
      paddingRight: 92,
    },
    headerContentRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
      minWidth: 0,
    },
    textColumn: {
      flex: 1,
      gap: isSplit ? spacing.xs : 2,
      minWidth: 0,
    },
    detailsDivider: {
      alignSelf: 'stretch',
    },
    eyebrow: {
      fontSize: 11,
      fontWeight: '600',
      letterSpacing: 0.45,
      textTransform: 'uppercase',
      color: colors.labelTertiary,
    },
    title: {
      ...typography.body,
      fontSize: compact ? 16 : isSplit ? 18 : 17,
      lineHeight: compact ? 21 : isSplit ? 23 : 22,
      fontWeight: '700',
      letterSpacing: -0.3,
      color: colors.labelPrimary,
    },
    location: {
      fontSize: 15,
      lineHeight: 20,
      fontWeight: '500',
      color: colors.labelSecondary,
    },
    meta: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.labelSecondary,
    },
    posted: {
      fontSize: 13,
      lineHeight: 18,
      color: colors.labelSecondary,
    },
    accent: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '600',
      color: colors.primary,
    },
    footer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: spacing.xs,
    },
    textFooter: {
      alignSelf: 'flex-start',
    },
    headerTrailing: {
      flexShrink: 0,
      paddingTop: 2,
      alignItems: 'flex-end',
    },
    contentSection: {
      gap: spacing.xs,
      alignSelf: 'stretch',
    },
    contentRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      minWidth: 0,
      alignSelf: 'stretch',
    },
    contentColumn: {
      flex: 1,
      minWidth: 0,
      gap: spacing.xs,
    },
    contentAccessoryCol: {
      flexShrink: 0,
      alignSelf: 'center',
      alignItems: 'flex-end',
    },
    contentBand: {
      backgroundColor: colors.fillSubtle,
      borderRadius: cardShellRadii.inner,
      padding: spacing.sm,
      marginTop: spacing.xs,
      alignSelf: 'stretch',
    },
    metaFooterRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
      minWidth: 0,
    },
    metaFooterLabel: {
      flex: 1,
      minWidth: 0,
    },
    metaFooterAccessory: {
      flexShrink: 0,
      alignItems: 'flex-end',
    },
    trailingCol: {
      flexShrink: 0,
      alignItems: 'flex-end',
      alignSelf: 'stretch',
      justifyContent: 'center',
      gap: spacing.xs,
    },
    cornerTrailing: {
      position: 'absolute',
      top: compact ? spacing.sm : spacing.md,
      right: compact ? spacing.sm : spacing.md,
      zIndex: 2,
      alignItems: 'flex-end',
    },
    chevronTrailing: {
      position: 'absolute',
      right: compact ? spacing.sm : spacing.md,
      top: 0,
      bottom: 0,
      justifyContent: 'center',
      zIndex: 1,
    },
    stackedChevronInset: {
      paddingRight: spacing.lg,
    },
    trailingBottom: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    statusFooterRow: {
      paddingTop: spacing.xs,
      alignSelf: 'stretch',
    },
    statusFooterEnd: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: spacing.sm,
      alignSelf: 'stretch',
    },
    rowAction: {
      marginTop: spacing.sm,
      alignSelf: 'stretch',
    },
  }));

  const stackedTextBlock = (
    <View style={styles.textColumn}>
      {subtitle ? (
        <>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          {subtitle}
        </>
      ) : (
        <>
          {eyebrow ? (
            <Text style={styles.eyebrow} numberOfLines={1}>
              {eyebrow}
            </Text>
          ) : null}
          {location ? (
            <Text style={styles.location} numberOfLines={1}>
              {location}
            </Text>
          ) : null}
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
        </>
      )}
      {detailsDivider && (usesMetaRows || meta || detail || postedLabel || footer || textFooter) ? (
        <View style={styles.detailsDivider}>
          <CardSectionDivider insetEnd={24} />
        </View>
      ) : null}
      {usesMetaRows
        ? metaRows?.map((row) => (
            <ListingMetaIconRow key={`${row.icon}-${row.label}`} icon={row.icon} label={row.label} />
          ))
        : null}
      {!usesMetaRows && meta ? (
        <Text style={styles.meta} numberOfLines={1}>
          {meta}
        </Text>
      ) : null}
      {!usesMetaRows && detail ? (
        <Text style={styles.meta} numberOfLines={1}>
          {detail}
        </Text>
      ) : null}
      {!usesMetaRows && postedLabel ? renderPostedLabel(postedLabel, styles.meta) : null}
      {footer ? <View style={styles.footer}>{footer}</View> : null}
      {textFooter ? <View style={styles.textFooter}>{textFooter}</View> : null}
    </View>
  );

  const splitHeaderPrimary = (
    <>
      <View style={styles.headerContentRow}>
        <View style={styles.textColumn}>
          {subtitle ? (
            <>
              <Text style={styles.title} numberOfLines={2}>
                {title}
              </Text>
              {subtitle}
            </>
          ) : (
            <>
              {eyebrow ? (
                <Text style={styles.eyebrow} numberOfLines={1}>
                  {eyebrow}
                </Text>
              ) : null}
              {location ? (
                <Text style={styles.location} numberOfLines={1}>
                  {location}
                </Text>
              ) : null}
              <Text style={styles.title} numberOfLines={2}>
                {title}
              </Text>
            </>
          )}
          {detailsDivider && (meta || headerDetail) ? (
            <View style={styles.detailsDivider}>
              <CardSectionDivider insetEnd={24} />
            </View>
          ) : null}
          {meta ? (
            <Text style={styles.location} numberOfLines={2}>
              {meta}
            </Text>
          ) : null}
          {headerDetail ? (
            <Text style={styles.meta} numberOfLines={2}>
              {headerDetail}
            </Text>
          ) : null}
        </View>
        {topTrailing ? <View style={styles.headerTrailing}>{topTrailing}</View> : null}
      </View>
    </>
  );

  const splitHeaderFooter =
    postedInHeader && headerAccent ? (
      <View style={styles.metaFooterRow}>
        {renderPostedLabel(postedLabel, [styles.posted, styles.metaFooterLabel])}
        <View style={styles.metaFooterAccessory}>
          <Text style={styles.accent} numberOfLines={1}>
            {headerAccent}
          </Text>
        </View>
      </View>
    ) : postedInHeader ? (
      renderPostedLabel(postedLabel, styles.posted)
    ) : headerAccent ? (
      <View style={styles.metaFooterRow}>
        <View style={styles.metaFooterLabel} />
        <View style={styles.metaFooterAccessory}>
          <Text style={styles.accent} numberOfLines={1}>
            {headerAccent}
          </Text>
        </View>
      </View>
    ) : null;

  const splitDetails = usesMetaRows ? (
    <>
      {metaRows?.map((row) => (
        <ListingMetaIconRow key={`${row.icon}-${row.label}`} icon={row.icon} label={row.label} />
      ))}
      {textFooter ? <View style={styles.textFooter}>{textFooter}</View> : null}
      {footer ? <View style={styles.footer}>{footer}</View> : null}
      {trailing && !contentAccessory ? (
        <View style={styles.metaFooterAccessory}>{trailing}</View>
      ) : null}
    </>
  ) : (
    <>
      {detail ? (
        <Text style={styles.meta} numberOfLines={2}>
          {detail}
        </Text>
      ) : null}
      {postedInContent && trailing && !contentAccessory ? (
        <View style={styles.metaFooterRow}>
          {renderPostedLabel(postedLabel, [styles.posted, styles.metaFooterLabel])}
          <View style={styles.metaFooterAccessory}>{trailing}</View>
        </View>
      ) : postedInContent ? (
        renderPostedLabel(postedLabel, styles.posted)
      ) : trailing && !contentAccessory ? (
        <View style={styles.metaFooterAccessory}>{trailing}</View>
      ) : null}
      {textFooter ? <View style={styles.textFooter}>{textFooter}</View> : null}
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </>
  );

  const splitContentSection = contentAccessory ? (
    <View style={styles.contentRow}>
      <View style={styles.contentColumn}>{splitDetails}</View>
      <View style={styles.contentAccessoryCol}>{contentAccessory}</View>
    </View>
  ) : (
    <View style={styles.contentSection}>{splitDetails}</View>
  );

  const splitTrailingColumn = showChevron ? (
    <View style={styles.trailingCol}>
      <Ionicons name="chevron-forward" size={16} color={colors.labelTertiary} />
    </View>
  ) : null;

  const useStackedCornerLayout = !isSplit && compact && Boolean(topTrailing);

  const stackedTrailingColumn =
    useStackedCornerLayout || !(topTrailing || trailing || showChevron) ? null : (
      <View style={styles.trailingCol}>
        {topTrailing ?? null}
        {trailing || showChevron ? (
          <View style={styles.trailingBottom}>
            {trailing}
            {showChevron ? (
              <Ionicons name="chevron-forward" size={16} color={colors.labelTertiary} />
            ) : null}
          </View>
        ) : null}
      </View>
    );

  const stackedMainRow = (
    <View style={[styles.headerRow, useStackedCornerLayout && showChevron && styles.stackedChevronInset]}>
      {avatar}
      <View style={[styles.headerBody, useStackedCornerLayout && styles.headerBodyCornerInset]}>
        {stackedTextBlock}
      </View>
      {stackedTrailingColumn}
    </View>
  );

  const stackedLayout = useStackedCornerLayout ? stackedMainRow : (
    <View style={styles.headerRow}>
      {avatar}
      <View style={[styles.headerBody, useStackedCornerLayout && styles.headerBodyCornerInset]}>
        {stackedTextBlock}
      </View>
      {topTrailing || trailing || showChevron ? (
        <View style={styles.trailingCol}>
          {topTrailing ?? null}
          {trailing || showChevron ? (
            <View style={styles.trailingBottom}>
              {trailing}
              {showChevron ? (
                <Ionicons name="chevron-forward" size={16} color={colors.labelTertiary} />
              ) : null}
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );

  const splitHeaderBlock = (
    <View style={styles.headerRow}>
      {avatar}
      <View style={styles.headerBody}>
        {splitHeaderPrimary}
        {splitHeaderFooter}
      </View>
      {splitTrailingColumn}
    </View>
  );

  const useHeaderPress = pressScope === 'header' && Boolean(onPress) && isSplit;

  const splitLayout = (
    <>
      {useHeaderPress ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onPress?.();
          }}
          style={({ pressed, hovered }) => [
            styles.headerPressTarget,
            webHover(hovered, pressed, styles.headerHovered),
            pressed && styles.headerPressed,
          ]}>
          {splitHeaderBlock}
        </Pressable>
      ) : (
        splitHeaderBlock
      )}
      {hasContentSection ? <View style={styles.contentBand}>{splitContentSection}</View> : null}
      {action ? <View style={styles.rowAction}>{action}</View> : null}
    </>
  );

  const stackedStatusFooter =
    !isSplit && statusFooter ? (
      <View
        style={[
          styles.statusFooterRow,
          statusFooterAlign === 'end' && styles.statusFooterEnd,
          useStackedCornerLayout && showChevron && styles.stackedChevronInset,
        ]}>
        {statusFooter}
      </View>
    ) : null;

  const content = (
    <>
      {isSplit ? (
        splitLayout
      ) : (
        <>
          {useStackedCornerLayout && topTrailing ? (
            <View style={styles.cornerTrailing}>{topTrailing}</View>
          ) : null}
          {stackedLayout}
          {stackedStatusFooter}
          {useStackedCornerLayout && showChevron ? (
            <View style={styles.chevronTrailing} pointerEvents="none">
              <Ionicons name="chevron-forward" size={16} color={colors.labelTertiary} />
            </View>
          ) : null}
        </>
      )}
      {isSplit && statusFooter ? (
        <View
          style={[
            styles.statusFooterRow,
            statusFooterAlign === 'end' && styles.statusFooterEnd,
          ]}>
          {statusFooter}
        </View>
      ) : null}
    </>
  );

  const rowBody = content;

  if (!onPress || useHeaderPress) {
    return <View style={[styles.container, paddingless && styles.containerPaddingless]}>{rowBody}</View>;
  }

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={({ pressed, hovered }) => [
        styles.container,
        paddingless && styles.containerPaddingless,
        webHover(hovered, pressed, styles.rowHovered),
        pressed && styles.rowPressed,
      ]}
    >
      {rowBody}
    </Pressable>
  );
}
