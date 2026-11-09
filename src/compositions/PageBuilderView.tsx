import type { CSSProperties, FC, ReactNode } from 'react'
import { Fragment } from 'react'
import { rollDigits } from '@/animations/pageBuilder'
import { PALETTE } from '@/config/builder'
import {
  BUILD_OPS,
  CHROME_HEIGHT,
  KPIS,
  MAIN_TREND,
  MAP_CELLS,
  MAP_COLS,
  MAP_PINS,
  MAP_ROWS,
  TILES,
  TRAFFIC_SERIES,
  WINDOW_RECT,
} from '@/data/builderLayout'
import type { Kpi, Tile } from '@/data/builderLayout'
import S from '@/styles/PageBuilder.module.less'

/**
 * 纯展示层：只把「每个元素此刻长到哪、内容露出多少」贴到 DOM 上，不读任何 Remotion Hook。
 * 所有元素都用「绝对定位 + 建造脚本里的矩形」摆放，因此手势层（选框、参考线、光标）
 * 与真实界面共用同一套窗口内坐标，选框永远严丝合缝地套在正在拖的东西上。
 */

type Rect = { x: number; y: number; width: number; height: number }

const ZERO: Rect = { x: 0, y: 0, width: 0, height: 0 }
/** 每一笔作业的矩形就是元素的最终位置，视图层直接查表 */
const OP_BOX = new Map<string, Rect>(BUILD_OPS.map(op => [op.id, op.rect]))
const boxOf = (id: string): Rect => OP_BOX.get(id) ?? ZERO

/** 相对某个父元素定位（父元素本身也是绝对定位的） */
const rel = (id: string, parentId: string): CSSProperties => {
  const box = boxOf(id)
  const parent = boxOf(parentId)
  return {
    position: 'absolute',
    left: box.x - parent.x,
    top: box.y - parent.y,
    width: box.width,
    height: box.height,
  }
}

export type ElementState = {
  /** 被拖出来的面积比例，驱动外层裁切 */
  reveal: number
  /** 元素内部内容的入场进度 */
  content: number
  /** 选框可见度（视图层不用，留给手势层判重） */
  select: number
  mode: 'drag' | 'place'
  rect: Rect
}

const EMPTY: ElementState = { reveal: 0, content: 0, select: 0, mode: 'place', rect: ZERO }

export type GetElement = (id: string) => ElementState

/**
 * 一个元素的出现方式：
 * drag 笔从左上角开始把矩形「拉」出来，内容随拖拽进度显影；
 * place 笔原地弹一下。两者都只在自己的时间窗内存在。
 */
const Reveal: FC<{
  state: ElementState
  style: CSSProperties
  className?: string
  wire?: boolean
  children: ReactNode
}> = ({ state, style, className, wire = true, children }) => {
  if (state.reveal <= 0.0005) return null

  const width = Number(style.width) || 0
  const height = Number(style.height) || 0
  const isPlace = state.mode === 'place'
  const visible = isPlace ? state.reveal : Math.min(1, state.content * 2.2)
  const outer: CSSProperties = isPlace
    ? { ...style }
    : { ...style, width: width * state.reveal, height: height * state.reveal, overflow: 'hidden' }

  return (
    <div className={className} style={outer}>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width,
          height,
          opacity: visible,
          transform: isPlace
            ? 'translateY(' + (1 - state.reveal) * 7 + 'px) scale(' + (0.975 + 0.025 * state.reveal) + ')'
            : undefined,
          transformOrigin: '0 0',
        }}
      >
        {children}
      </div>
      {wire && !isPlace ? (
        <div className={S.wireFill} style={{ opacity: Math.max(0, 1 - state.content * 1.35) }} />
      ) : null}
    </div>
  )
}

/* ===================== 迷你图表 ===================== */

const Spark: FC<{ values: readonly number[]; width: number; height: number; color: string; fill: string }> = ({
  values,
  width,
  height,
  color,
  fill,
}) => {
  const max = Math.max(...values)
  const min = Math.min(...values)
  const span = max - min || 1
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width
    const y = height - ((v - min) / span) * (height - 8) - 4
    return [x, y] as const
  })
  const line = pts.map(([x, y], i) => (i === 0 ? 'M' : 'L') + x.toFixed(1) + ' ' + y.toFixed(1)).join(' ')
  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <path d={line + ' L' + width.toFixed(1) + ' ' + height + ' L0 ' + height + ' Z'} fill={fill} />
      <path d={line} fill='none' stroke={color} strokeWidth={1.7} strokeLinecap='round' />
    </svg>
  )
}

/* ===================== 应用外壳 ===================== */

const NAV_ITEMS = [
  { id: 'nav-dash', label: 'Dashboard', active: true },
  { id: 'nav-interface', label: 'Interface', active: false },
  { id: 'nav-forms', label: 'Forms', active: false },
  { id: 'nav-extra', label: 'Extra', active: false },
  { id: 'nav-layout', label: 'Layout', active: false },
  { id: 'nav-plugins', label: 'Plugins', active: false },
  { id: 'nav-help', label: 'Help', active: false },
] as const

const ChromeBar: FC<{ el: GetElement }> = ({ el }) => (
  <>
    <div className={S.chromeBg} />

    <Reveal state={el('brand-mark')} style={rel('brand-mark', 'chrome')} wire={false}>
      <div className={S.brandMark} />
    </Reveal>

    <Reveal state={el('brand-name')} style={rel('brand-name', 'chrome')} wire={false}>
      <div className={S.brandName}>tabler</div>
    </Reveal>

    {NAV_ITEMS.map(item => (
      <Fragment key={item.id}>
        <Reveal state={el(item.id)} style={rel(item.id, 'chrome')} wire={false}>
          <div className={S.navItem + (item.active ? ' ' + S.navItemActive : '')}>
            {item.label}
            {item.active ? <span className={S.navCaret}>v</span> : null}
          </div>
        </Reveal>
        {/* 每个菜单项下面自己扫进一段下划线 */}
        <Reveal state={el(item.id + '-line')} style={rel(item.id + '-line', 'chrome')} wire={false}>
          <div className={S.navLine} />
        </Reveal>
      </Fragment>
    ))}

    <Reveal state={el('chip-pkg')} style={rel('chip-pkg', 'chrome')} wire={false}>
      <div className={S.chip}>All Package</div>
    </Reveal>

    <Reveal state={el('chip-lang')} style={rel('chip-lang', 'chrome')} wire={false}>
      <div className={S.chip}>EN</div>
    </Reveal>

    <Reveal state={el('avatar')} style={rel('avatar', 'chrome')} wire={false}>
      <div className={S.avatar} />
    </Reveal>

    <Reveal state={el('identity-name')} style={rel('identity-name', 'chrome')} wire={false}>
      <div className={S.identityName}>Fawei Kuna</div>
    </Reveal>

    <Reveal state={el('identity-role')} style={rel('identity-role', 'chrome')} wire={false}>
      <div className={S.identityRole}>Product designer</div>
    </Reveal>
  </>
)

/* ===================== 页头 ===================== */

const PageHeader: FC<{ el: GetElement }> = ({ el }) => (
  <>
    <Reveal state={el('eyebrow')} style={rel('eyebrow', 'chrome')} wire={false}>
      <div className={S.eyebrow}>OVERVIEW</div>
    </Reveal>

    <Reveal state={el('page-title')} style={rel('page-title', 'chrome')} wire={false}>
      <div className={S.pageTitle}>Dashboard</div>
    </Reveal>

    <Reveal state={el('btn-ghost')} style={rel('btn-ghost', 'chrome')}>
      <div className={S.ghostBtn}>New view</div>
    </Reveal>

    <Reveal state={el('btn-primary')} style={rel('btn-primary', 'chrome')}>
      <div className={S.primaryBtn}>Create new report</div>
    </Reveal>
  </>
)

/* ===================== 首行三卡 ===================== */

const HeroCard: FC<{ el: GetElement }> = ({ el }) => {
  const salesBar = el('hero-stat-sales-bar')
  const growthBar = el('hero-stat-growth-bar')
  return (
    <div className={S.card} style={{ padding: '18px 22px' }}>
      <Reveal state={el('hero-title')} style={rel('hero-title', 'hero')} wire={false}>
        <div className={S.heroTitle}>Welcome back Pavel</div>
      </Reveal>
      <Reveal state={el('hero-sub')} style={rel('hero-sub', 'hero')} wire={false}>
        <div className={S.heroSub}>Today you have 3 new reports and 12 tasks</div>
      </Reveal>

      <Reveal state={el('hero-stat-sales-label')} style={rel('hero-stat-sales-label', 'hero')} wire={false}>
        <div className={S.statLabel}>TODAY'S SALES</div>
      </Reveal>
      <Reveal state={el('hero-stat-sales-value')} style={rel('hero-stat-sales-value', 'hero')} wire={false}>
        <div className={S.statValue}>{rollDigits('6,782', el('hero-stat-sales-value').content)}</div>
      </Reveal>
      <Reveal state={salesBar} style={rel('hero-stat-sales-bar', 'hero')} wire={false}>
        <div className={S.progressTrack}>
          <div className={S.progressFill} style={{ width: 75 * salesBar.content + '%' }} />
        </div>
      </Reveal>

      <Reveal state={el('hero-stat-growth-label')} style={rel('hero-stat-growth-label', 'hero')} wire={false}>
        <div className={S.statLabel}>GROWTH RATE</div>
      </Reveal>
      <Reveal state={el('hero-stat-growth-value')} style={rel('hero-stat-growth-value', 'hero')} wire={false}>
        <div className={S.statValue}>
          {rollDigits('78.4', el('hero-stat-growth-value').content)}
          <span style={{ fontSize: 15 }}>%</span>
        </div>
      </Reveal>
      <Reveal state={growthBar} style={rel('hero-stat-growth-bar', 'hero')} wire={false}>
        <div className={S.progressTrack}>
          <div className={S.progressFill} style={{ width: 68 * growthBar.content + '%', background: PALETTE.red }} />
        </div>
      </Reveal>

      <Reveal state={el('hero-chart-ring')} style={rel('hero-chart-ring', 'hero')} wire={false}>
        <div className={S.goalRing}>
          <svg width={84} height={84}>
            <circle cx={42} cy={42} r={GOAL_R} fill='none' stroke='#22272f' strokeWidth={7} />
            <circle
              cx={42}
              cy={42}
              r={GOAL_R}
              fill='none'
              stroke={PALETTE.accentLight}
              strokeWidth={7}
              strokeLinecap='round'
              strokeDasharray={GOAL_C + ' ' + GOAL_C}
              strokeDashoffset={GOAL_C * (1 - 0.68 * el('hero-chart-ring').content)}
              transform={'rotate(-90 42 42)'}
            />
          </svg>
          <div className={S.goalCap}>GOAL</div>
        </div>
      </Reveal>
      <Reveal state={el('hero-chart-tile')} style={rel('hero-chart-tile', 'hero')} wire={false}>
        <div className={S.goalPill}>+18.2%</div>
      </Reveal>
    </div>
  )
}

const UsersCard: FC<{ el: GetElement }> = ({ el }) => {
  const spark = el('users-spark')
  return (
    <div className={S.card} style={{ padding: '18px 22px' }}>
      <Reveal state={el('users-head-title')} style={rel('users-head-title', 'users')} wire={false}>
        <div className={S.cardTitle}>TOTAL USERS</div>
      </Reveal>
      <Reveal state={el('users-head-meta')} style={rel('users-head-meta', 'users')} wire={false}>
        <div className={S.cardMeta}>Last 7 days</div>
      </Reveal>
      <Reveal state={el('users-value')} style={rel('users-value', 'users')} wire={false}>
        <div className={S.statValue} style={{ fontSize: 30 }}>
          {rollDigits('75,782', el('users-value').content)}
        </div>
      </Reveal>
      <Reveal state={spark} style={rel('users-spark', 'users')} wire={false}>
        <div style={{ opacity: spark.content }}>
          <Spark values={MAIN_TREND} width={440} height={86} color={PALETTE.accentLight} fill='rgba(91,141,255,0.13)' />
        </div>
      </Reveal>
    </div>
  )
}

const GOAL_R = 34
const GOAL_C = 2 * Math.PI * GOAL_R

const RING_R = 50
const RING_C = 2 * Math.PI * RING_R

const ActiveCard: FC<{ el: GetElement }> = ({ el }) => {
  const arc = el('active-ring-arc')
  return (
    <div className={S.card} style={{ padding: '18px 22px' }}>
      <Reveal state={el('active-head-title')} style={rel('active-head-title', 'active')} wire={false}>
        <div className={S.cardTitle}>ACTIVE USERS</div>
      </Reveal>
      <Reveal state={el('active-head-meta')} style={rel('active-head-meta', 'active')} wire={false}>
        <div className={S.cardMeta}>Last 7 days</div>
      </Reveal>

      <Reveal state={el('active-ring-track')} style={rel('active-ring-track', 'active')} wire={false}>
        <div className={S.ringWrap}>
          <svg width={186} height={132}>
            <circle cx={93} cy={70} r={RING_R} fill='none' stroke='#22272f' strokeWidth={13} />
          </svg>
        </div>
      </Reveal>

      <Reveal state={arc} style={rel('active-ring-arc', 'active')} wire={false}>
        <div className={S.ringWrap}>
          <svg width={186} height={132}>
            <circle
              cx={93}
              cy={70}
              r={RING_R}
              fill='none'
              stroke={PALETTE.accentLight}
              strokeWidth={13}
              strokeLinecap='round'
              strokeDasharray={RING_C + ' ' + RING_C}
              strokeDashoffset={RING_C * (1 - 0.58 * arc.content)}
              transform={'rotate(-90 93 70)'}
            />
          </svg>
          <div className={S.ringText} style={{ left: 93, top: 70, transform: 'translate(-50%, -50%)' }}>
            <div className={S.ringVal}>25,782</div>
            <div className={S.ringCap}>58%</div>
          </div>
        </div>
      </Reveal>
    </div>
  )
}

/* ===================== KPI 行 ===================== */

const KpiCard: FC<{ kpi: Kpi; el: GetElement }> = ({ kpi, el }) => {
  const value = el(kpi.id + '-value')
  const spark = el('spark-' + kpi.id)
  const bar = el(kpi.id + '-bar')
  return (
    <div className={S.card} style={{ padding: '16px 20px' }}>
      <Reveal state={el(kpi.id + '-head-label')} style={rel(kpi.id + '-head-label', kpi.id)} wire={false}>
        <div className={S.cardMeta}>{kpi.label}</div>
      </Reveal>
      <Reveal state={el(kpi.id + '-head-meta')} style={rel(kpi.id + '-head-meta', kpi.id)} wire={false}>
        <div className={S.cardMeta} style={{ textAlign: 'right', color: kpi.up ? PALETTE.green : PALETTE.red }}>
          {kpi.delta}
        </div>
      </Reveal>
      <Reveal state={value} style={rel(kpi.id + '-value', kpi.id)} wire={false}>
        <div className={S.statValue} style={{ fontSize: 25, marginTop: 0 }}>
          {rollDigits(kpi.value, value.content)}
        </div>
      </Reveal>
      <Reveal state={spark} style={rel('spark-' + kpi.id, kpi.id)} wire={false}>
        <div style={{ opacity: spark.content }}>
          <Spark
            values={kpi.spark}
            width={310}
            height={46}
            color={kpi.up ? PALETTE.green : PALETTE.red}
            fill={kpi.up ? 'rgba(55,201,120,0.11)' : 'rgba(242,84,91,0.11)'}
          />
        </div>
      </Reveal>
      <Reveal state={bar} style={rel(kpi.id + '-bar', kpi.id)} wire={false}>
        <div className={S.progressTrack} style={{ height: 5 }}>
          <div
            className={S.progressFill}
            style={{ width: kpi.progress * bar.content + '%', background: kpi.up ? PALETTE.green : PALETTE.red }}
          />
        </div>
      </Reveal>
    </div>
  )
}

/* ===================== 图标行 ===================== */

const tileGlyph = (icon: Tile['icon']): ReactNode => {
  if (icon === 'cart') {
    return (
      <svg width={22} height={22} viewBox='0 0 24 24' fill='none' stroke='#fff' strokeWidth={1.8}>
        <path d='M4 5h2l2.2 9.2h9.4L20 8H7' strokeLinecap='round' strokeLinejoin='round' />
        <circle cx={9.5} cy={18.5} r={1.5} fill='#fff' stroke='none' />
        <circle cx={17} cy={18.5} r={1.5} fill='#fff' stroke='none' />
      </svg>
    )
  }
  if (icon === 'box') {
    return (
      <svg width={22} height={22} viewBox='0 0 24 24' fill='none' stroke='#fff' strokeWidth={1.8}>
        <path d='M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z' strokeLinejoin='round' />
        <path d='M4 7.5l8 4.5 8-4.5M12 12v9' strokeLinejoin='round' />
      </svg>
    )
  }
  if (icon === 'share') {
    return (
      <svg width={22} height={22} viewBox='0 0 24 24' fill='none' stroke='#c7cedb' strokeWidth={1.8}>
        <circle cx={18} cy={6} r={2.6} />
        <circle cx={6} cy={12} r={2.6} />
        <circle cx={18} cy={18} r={2.6} />
        <path d='M8.3 10.8l7.4-3.6M8.3 13.2l7.4 3.6' strokeLinecap='round' />
      </svg>
    )
  }
  return (
    <svg width={22} height={22} viewBox='0 0 24 24' fill='#fff'>
      <path d='M12 20s-7.5-4.6-7.5-9.4A4.1 4.1 0 0112 7.7a4.1 4.1 0 017.5 2.9C19.5 15.4 12 20 12 20z' />
    </svg>
  )
}

const TileRow: FC<{ tile: Tile; el: GetElement }> = ({ tile, el }) => {
  const iconClass = tile.tone === 'green' ? S.tileIconGreen : tile.tone === 'blue' ? S.tileIconBlue : S.tileIconDark
  return (
    <div className={S.card + ' ' + S.tileRow} style={{ padding: '0 20px' }}>
      <Reveal state={el(tile.id + '-icon')} style={rel(tile.id + '-icon', tile.id)} wire={false}>
        <div className={S.tileIcon + ' ' + iconClass}>{tileGlyph(tile.icon)}</div>
      </Reveal>
      <Reveal state={el(tile.id + '-title')} style={rel(tile.id + '-title', tile.id)} wire={false}>
        <div className={S.tileTitle}>{tile.title}</div>
      </Reveal>
      <Reveal state={el(tile.id + '-sub')} style={rel(tile.id + '-sub', tile.id)} wire={false}>
        <div className={S.tileSub}>{tile.sub}</div>
      </Reveal>
    </div>
  )
}

/* ===================== 底部两卡 ===================== */

/** 三色堆叠柱的最大总高，用来把数据归一化到容器高度内（否则柱会顶出卡片盖住图例） */
const TRAFFIC_MAX = Math.max(...TRAFFIC_SERIES.map(t => t[0] + t[1] + t[2]))
const TRAFFIC_BAR_MAX = 148
const TRAFFIC_AREA_WIDTH = 962

const TRAFFIC_LEGEND = [
  { key: 'web', id: 'traffic-legend-web', color: PALETTE.accentLight },
  { key: 'social', id: 'traffic-legend-social', color: PALETTE.accent },
  { key: 'other', id: 'traffic-legend-other', color: PALETTE.green },
] as const

const TrafficCard: FC<{ el: GetElement }> = ({ el }) => (
  <div className={S.card} style={{ padding: '16px 22px 12px' }}>
    <Reveal state={el('traffic-title')} style={rel('traffic-title', 'traffic')} wire={false}>
      <div className={S.cardTitle}>Traffic summary</div>
    </Reveal>

    {/* 图例三项各落一次 */}
    {TRAFFIC_LEGEND.map(item => (
      <Reveal key={item.id} state={el(item.id)} style={rel(item.id, 'traffic')} wire={false}>
        <div className={S.legendItem}>
          <span className={S.legendDot} style={{ background: item.color }} />
          <span style={{ textTransform: 'capitalize' }}>{item.key}</span>
        </div>
      </Reveal>
    ))}

    {/* 26 根柱子被切成三段，三个窗口各扫过自己那一条竖带 */}
    {(['traffic-web', 'traffic-social', 'traffic-other'] as const).map(segId => {
      const seg = el(segId)
      const shift = boxOf(segId).x - boxOf('traffic-web').x
      return (
        <Reveal key={segId} state={seg} style={rel(segId, 'traffic')} wire={false}>
          <div className={S.bars} style={{ width: TRAFFIC_AREA_WIDTH, marginLeft: -shift }}>
            {TRAFFIC_SERIES.map((triple, i) => (
              <div key={i} className={S.barCol}>
                {[2, 1, 0].map(idx => (
                  <div
                    key={idx}
                    className={S.barSeg}
                    style={{
                      height:
                        (triple[idx] / TRAFFIC_MAX) *
                        TRAFFIC_BAR_MAX *
                        Math.min(1, Math.max(0, seg.content * 1.4 - i * 0.012)),
                      background: TRAFFIC_LEGEND[idx].color,
                      opacity: idx === 2 ? 0.85 : 1,
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
        </Reveal>
      )
    })}

    {/* 坐标轴：横线先扫过来，日期再落上去 */}
    <Reveal state={el('traffic-axis-line')} style={rel('traffic-axis-line', 'traffic')} wire={false}>
      <div className={S.axisRule} />
    </Reveal>
    <Reveal state={el('traffic-axis-labels')} style={rel('traffic-axis-labels', 'traffic')} wire={false}>
      <div className={S.axis} style={{ width: TRAFFIC_AREA_WIDTH }}>
        <span>20 Jun</span>
        <span>24 Jun</span>
        <span>28 Jun</span>
        <span>02 Jul</span>
        <span>06 Jul</span>
        <span>10 Jul</span>
        <span>14 Jul</span>
        <span>18 Jul</span>
        <span>22 Jul</span>
      </div>
    </Reveal>
  </div>
)

const MAP_DOT = 4.9
/** 点阵按大洲切成三段：美洲 / 欧洲-非洲 / 亚太 */
const MAP_SPLITS = [0, 28, 59, MAP_COLS] as const
const MAP_WIDTH = MAP_COLS * MAP_DOT

const MapCard: FC<{ el: GetElement }> = ({ el }) => (
  <div className={S.card} style={{ padding: '16px 22px 14px' }}>
    <Reveal state={el('map-title')} style={rel('map-title', 'locations')} wire={false}>
      <div className={S.cardTitle}>Locations</div>
    </Reveal>

    {(['amer', 'emea', 'apac'] as const).map((slice, si) => {
      const state = el('map-dots-' + slice)
      const from = MAP_SPLITS[si]
      const to = MAP_SPLITS[si + 1]
      return (
        <Reveal key={slice} state={state} style={rel('map-dots-' + slice, 'locations')} wire={false}>
          <div className={S.mapWrap} style={{ width: (to - from) * MAP_DOT, height: MAP_ROWS * MAP_DOT }}>
            <svg
              width={MAP_WIDTH}
              height={MAP_ROWS * MAP_DOT}
              style={{ display: 'block', marginLeft: -from * MAP_DOT }}
            >
              {MAP_CELLS.filter(c => c.col >= from && c.col < to).map(c => (
                <rect
                  key={c.col + '-' + c.row}
                  x={c.col * MAP_DOT}
                  y={c.row * MAP_DOT}
                  width={MAP_DOT - 1.1}
                  height={MAP_DOT - 1.1}
                  rx={0.9}
                  className={S.mapDot}
                  opacity={Math.min(1, Math.max(0, state.content * 2.8 - ((c.col - from) / (to - from)) * 1.2))}
                />
              ))}
            </svg>
          </div>
        </Reveal>
      )
    })}

    {/* 四个据点叠在整块点阵上，各落一次 */}
    <MapPins el={el} />
  </div>
)

/** 四个据点：共用点阵坐标系，位置由经纬度换算而来 */
const MapPins: FC<{ el: GetElement }> = ({ el }) => {
  const origin = boxOf('map-dots-amer')
  const parent = boxOf('locations')
  return (
    <div
      style={{
        position: 'absolute',
        left: origin.x - parent.x,
        top: origin.y - parent.y,
        width: MAP_WIDTH,
        height: MAP_ROWS * MAP_DOT,
      }}
    >
      <svg width={MAP_WIDTH} height={MAP_ROWS * MAP_DOT} fill='none' style={{ display: 'block' }}>
        {(['map-pin-sf', 'map-pin-ldn', 'map-pin-tky', 'map-pin-syd'] as const).map((id, i) => {
          const t = el(id).reveal
          const pin = MAP_PINS[i]
          return (
            <g key={id} opacity={t}>
              <circle cx={pin.col * MAP_DOT} cy={pin.row * MAP_DOT} r={10 * t} fill={pin.color} fillOpacity={0.22} />
              <circle cx={pin.col * MAP_DOT} cy={pin.row * MAP_DOT} r={3.6 * t} fill={pin.color} />
            </g>
          )
        })}
      </svg>
    </div>
  )
}

/* ===================== 收尾字幕 ===================== */

const OutroCaption: FC<{ el: GetElement }> = ({ el }) => (
  <Reveal state={el('outro-caption')} style={rel('outro-caption', 'chrome')} wire={false}>
    <div className={S.outroCaption}>
      <span className={S.outroDot} />
      Built together, in real time
    </div>
  </Reveal>
)

/* ===================== 手势层 ===================== */

export type CursorState = {
  def: { id: string; color: string; label: string; scale: number }
  x: number
  y: number
  ripple: number
  /** 登场/退场透明度，0 表示这支光标此刻不在画面上 */
  presence: number
}

export type SelectionState = {
  id: string
  rect: Rect
  opacity: number
  label: string
}

/** 选框四角 + 四边中点的手柄 */
const HANDLES: readonly (readonly [CSSProperties['left'], CSSProperties['top']])[] = [
  ['-5px', '-5px'],
  ['calc(50% - 4px)', '-5px'],
  ['calc(100% - 3px)', '-5px'],
  ['calc(100% - 3px)', 'calc(50% - 4px)'],
  ['calc(100% - 3px)', 'calc(100% - 3px)'],
  ['calc(50% - 4px)', 'calc(100% - 3px)'],
  ['-5px', 'calc(100% - 3px)'],
  ['-5px', 'calc(50% - 4px)'],
]

const CursorGlyph: FC<{ color: string }> = ({ color }) => (
  <svg width={17} height={21} viewBox='0 0 17 21' fill='none'>
    <path
      d='M1.4 1.2l14 7.6-6.2 1.5-2.6 6.1-5.2-15.2z'
      fill={color}
      stroke='rgba(0,0,0,0.55)'
      strokeWidth={1.1}
      strokeLinejoin='round'
    />
  </svg>
)

/* ===================== 视图 ===================== */

export type PageBuilderViewProps = {
  /** 窗口淡入 */
  windowProgress: number
  /** 收尾轻推 */
  settleProgress: number
  /** 所有元素的入场状态 */
  elements: Record<string, ElementState>
  /** 当前可见选框（窗口内坐标） */
  selections: readonly SelectionState[]
  /** 参考线：跟着最新一支拖拽的选框走 */
  guides: { x: number; y: number; xLabel: string; yLabel: string; opacity: number }
  cursors: readonly CursorState[]
}

export const PageBuilderView: FC<PageBuilderViewProps> = ({
  windowProgress,
  settleProgress,
  elements,
  selections,
  guides,
  cursors,
}) => {
  const el: GetElement = id => elements[id] ?? EMPTY
  // 片头就是一块纯色窗口，不做「从透明淡入」，否则第一帧看起来是黑屏
  const windowOpacity = Math.min(1, 0.78 + windowProgress * 0.34)
  const windowScale = (0.972 + 0.028 * windowProgress) * (1 + 0.012 * settleProgress)

  return (
    <div className={S.stage}>
      <div className={S.grain} />
      <div
        className={S.windowShell}
        style={{
          left: WINDOW_RECT.x,
          top: WINDOW_RECT.y,
          width: WINDOW_RECT.width,
          height: WINDOW_RECT.height,
          opacity: windowOpacity,
          transform: 'translateY(' + (1 - windowProgress) * 24 + 'px) scale(' + windowScale + ')',
        }}
      >
        {/* 应用外壳：一开始什么都没有，被光标一条一条搭出来 */}
        <Reveal
          state={el('chrome')}
          style={{ position: 'absolute', left: 0, top: 0, width: WINDOW_RECT.width, height: CHROME_HEIGHT }}
          wire={false}
          className={S.chromeSlot}
        >
          <ChromeBar el={el} />
        </Reveal>

        <PageHeader el={el} />

        {/* 卡片层 */}
        <Reveal state={el('hero')} style={rel('hero', 'chrome')} className={S.block}>
          <HeroCard el={el} />
        </Reveal>
        <Reveal state={el('users')} style={rel('users', 'chrome')} className={S.block}>
          <UsersCard el={el} />
        </Reveal>
        <Reveal state={el('active')} style={rel('active', 'chrome')} className={S.block}>
          <ActiveCard el={el} />
        </Reveal>

        {KPIS.map(kpi => (
          <Reveal key={kpi.id} state={el(kpi.id)} style={rel(kpi.id, 'chrome')} className={S.block}>
            <KpiCard kpi={kpi} el={el} />
          </Reveal>
        ))}

        {TILES.map(tile => (
          <Reveal key={tile.id} state={el(tile.id)} style={rel(tile.id, 'chrome')} className={S.block}>
            <TileRow tile={tile} el={el} />
          </Reveal>
        ))}

        <Reveal state={el('traffic')} style={rel('traffic', 'chrome')} className={S.block}>
          <TrafficCard el={el} />
        </Reveal>
        <Reveal state={el('locations')} style={rel('locations', 'chrome')} className={S.block}>
          <MapCard el={el} />
        </Reveal>

        <OutroCaption el={el} />

        {/* 设计工具手势层（与上面同一套窗口坐标） */}
        <div className={S.overlay}>
          {guides.opacity > 0.001 ? (
            <>
              <div className={S.guideV} style={{ left: guides.x, opacity: guides.opacity * 0.85 }} />
              <div
                className={S.guideTag}
                style={{ left: guides.x + 6, top: 4, background: PALETTE.guideX, opacity: guides.opacity }}
              >
                {guides.xLabel}
              </div>
              <div className={S.guideH} style={{ top: guides.y, opacity: guides.opacity * 0.8 }} />
              <div
                className={S.guideTag}
                style={{ left: 4, top: guides.y - 18, background: PALETTE.guideY, opacity: guides.opacity }}
              >
                {guides.yLabel}
              </div>
            </>
          ) : null}

          {selections.map(sel =>
            sel.opacity > 0.001 ? (
              <div
                key={sel.id}
                className={S.selRect}
                style={{
                  left: sel.rect.x,
                  top: sel.rect.y,
                  width: sel.rect.width,
                  height: sel.rect.height,
                  opacity: sel.opacity,
                }}
              >
                {HANDLES.map(([left, top], i) => (
                  <div key={i} className={S.handle} style={{ left, top }} />
                ))}
                <div className={S.selLabel} style={{ opacity: sel.opacity }}>
                  {sel.label}
                </div>
              </div>
            ) : null,
          )}

          {/* 只画在场的光标：每支只在自己那几笔作业前后存在，干完就走 */}
          {cursors.map(({ def, x, y, ripple, presence }) =>
            presence > 0.002 ? (
              <div
                key={def.id}
                className={S.cursor}
                style={{
                  left: x,
                  top: y,
                  opacity: presence,
                  transform: 'translate(-2px, -2px) scale(' + def.scale + ')',
                  transformOrigin: '2px 2px',
                }}
              >
                <CursorGlyph color={def.color} />
                <div className={S.cursorLabel} style={{ background: def.color }}>
                  {def.label}
                </div>
                {ripple >= 0 ? (
                  <div
                    className={S.ripple}
                    style={{
                      left: 4,
                      top: 4,
                      width: 10 + ripple * 46,
                      height: 10 + ripple * 46,
                      opacity: (1 - ripple) * 0.8,
                      color: def.color,
                    }}
                  />
                ) : null}
              </div>
            ) : null,
          )}
        </div>
      </div>
      <div className={S.noise} />
    </div>
  )
}
