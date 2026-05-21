/**
 * Action — drill-down page for Tier 1 ("What should I make next").
 *
 * The action layer: concrete moves backed by data. The old Tier 1 grid
 * shoved 5 widgets into a 3-col layout where the OutlierFeed had to span
 * two columns and the inner cards were forced into thumbnails-and-handles.
 * On this page each widget gets its own row at col-12 / col-6.
 *
 * Layout (12-col grid):
 *   - Outlier Feed (3-card grid inside col-12)        col-12
 *   - Next Posts Ranked (2-card grid inside col-12)   col-12
 *   - Whitespace Keywords     col-6 │ Cross-Niche     col-6
 *   - Early Sounds Radar (horizontal scroll)          col-12
 */

import TierSectionHeader from '../../components/insights/TierSectionHeader'
import WidgetErrorBoundary from '../../components/insights/WidgetErrorBoundary'
import OutlierFeed from '../../components/insights/OutlierFeed'
import NextPostsRanked from '../../components/insights/widgets/tier1/NextPostsRanked'
import WhitespaceKeywords from '../../components/insights/widgets/tier1/WhitespaceKeywords'
import CrossNicheImports from '../../components/insights/widgets/tier1/CrossNicheImports'
import EarlySoundsRadar from '../../components/insights/widgets/tier1/EarlySoundsRadar'

export default function Action() {
  return (
    <>
      <TierSectionHeader
        variant="page"
        tier="Insights / Action"
        title="What should I make next"
        question="Concrete moves backed by data — outliers worth reverse-engineering, whitespace keywords, sounds worth riding."
        icon="fa-rocket"
        iconBg="bg-orange-500/15"
        iconColor="text-orange-400"
        backHref="/dashboard"
      />

      <div className="grid grid-cols-12 gap-4 lg:gap-6">
        {/* Outlier feed — widest card; the OutlierFeed widget already
            renders an internal 3-card grid for the 3 sample outliers. */}
        <div className="col-span-12">
          <WidgetErrorBoundary name="OutlierFeed">
            <OutlierFeed />
          </WidgetErrorBoundary>
        </div>

        {/* Next Posts Ranked — full-width so the inner cards can be larger. */}
        <div className="col-span-12">
          <WidgetErrorBoundary name="NextPostsRanked">
            <NextPostsRanked />
          </WidgetErrorBoundary>
        </div>

        {/* Whitespace Keywords │ Cross-Niche Imports. */}
        <div className="col-span-12 lg:col-span-6">
          <WidgetErrorBoundary name="WhitespaceKeywords">
            <WhitespaceKeywords />
          </WidgetErrorBoundary>
        </div>
        <div className="col-span-12 lg:col-span-6">
          <WidgetErrorBoundary name="CrossNicheImports">
            <CrossNicheImports />
          </WidgetErrorBoundary>
        </div>

        {/* Early Sounds Radar — horizontal scroll inside col-12. */}
        <div className="col-span-12">
          <WidgetErrorBoundary name="EarlySoundsRadar">
            <EarlySoundsRadar />
          </WidgetErrorBoundary>
        </div>
      </div>
    </>
  )
}
