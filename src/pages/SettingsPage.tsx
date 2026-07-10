import { useState, type ReactNode } from 'react'
import { Mail, MessageSquare, Plus, Siren, Trash2, Webhook, Zap } from 'lucide-react'
import {
  ACCENT_PRESETS,
  useSettings,
  type IntegrationId,
} from '@/stores/settings'
import { Section } from '@/components/ui/Section'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

const INTEGRATIONS: { id: IntegrationId; label: string; hint: string; Icon: typeof Mail }[] = [
  { id: 'slack', label: 'Slack', hint: 'Alerts to #ops channel', Icon: MessageSquare },
  { id: 'email', label: 'Email', hint: 'Daily digest + criticals', Icon: Mail },
  { id: 'pagerduty', label: 'PagerDuty', hint: 'Page on-call for criticals', Icon: Siren },
  { id: 'webhook', label: 'Webhook', hint: 'POST events to a URL', Icon: Webhook },
]

function Switch({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={onClick}
      className={cn(
        'relative h-6 w-11 shrink-0 rounded-full border transition-colors',
        on ? 'border-accent/40 bg-accent/25' : 'border-border bg-surface-3',
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 h-4.5 w-4.5 rounded-full transition-all',
          on ? 'left-[22px] bg-accent' : 'left-0.5 bg-fg-faint',
        )}
        style={{ height: 18, width: 18 }}
      />
    </button>
  )
}

export function SettingsPage() {
  const {
    accent,
    setAccent,
    density,
    setDensity,
    integrations,
    toggleIntegration,
    rules,
    addRule,
    toggleRule,
    removeRule,
  } = useSettings()

  const [when, setWhen] = useState('')
  const [then, setThen] = useState('')

  const submitRule = () => {
    if (!when.trim() || !then.trim()) return
    addRule({ when: when.trim(), then: then.trim() })
    setWhen('')
    setThen('')
  }

  const activeRules = rules.filter((r) => r.enabled).length
  const connected = Object.values(integrations).filter(Boolean).length

  return (
    <div className="space-y-6">
      {/* Appearance */}
      <Section title="Appearance" subtitle="Accent colour and page spacing">
        <Card className="space-y-5 p-5">
          <Row label="Accent colour" hint="Drives buttons, highlights and charts">
            <div className="flex items-center gap-2">
              {ACCENT_PRESETS.map((hex) => (
                <button
                  key={hex}
                  onClick={() => setAccent(hex)}
                  aria-label={`accent ${hex}`}
                  className={cn(
                    'h-7 w-7 rounded-full ring-2 ring-offset-2 ring-offset-surface transition-transform hover:scale-110',
                    accent === hex ? 'ring-fg' : 'ring-transparent',
                  )}
                  style={{ backgroundColor: hex }}
                />
              ))}
              <label className="relative ml-1 h-7 w-7 cursor-pointer overflow-hidden rounded-full border border-border">
                <input
                  type="color"
                  value={accent}
                  onChange={(e) => setAccent(e.target.value)}
                  className="absolute -left-2 -top-2 h-12 w-12 cursor-pointer border-0 bg-transparent p-0"
                />
              </label>
            </div>
          </Row>

          <div className="h-px bg-border" />

          <Row label="Density" hint="Spacing around dashboard pages">
            <div className="flex gap-1.5">
              {(['comfortable', 'compact'] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setDensity(d)}
                  className={cn(
                    'rounded-lg border px-3 py-1.5 text-[12px] font-medium capitalize transition-colors',
                    density === d
                      ? 'border-fg-faint bg-surface-2 text-fg'
                      : 'border-border text-fg-muted hover:text-fg',
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
          </Row>
        </Card>
      </Section>

      {/* Integrations */}
      <Section
        title="Integrations"
        subtitle={`${connected} of ${INTEGRATIONS.length} configured locally`}
        action={<Badge color="#fbbf24">preview only</Badge>}
      >
        <p className="mb-3 text-[12px] text-fg-faint">
          These switches are stored in this browser only. They do not connect external services or send alerts.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {INTEGRATIONS.map(({ id, label, hint, Icon }) => {
            const on = integrations[id]
            return (
              <Card key={id} className="flex items-center gap-3 p-4">
                <span
                  className={cn(
                    'grid h-10 w-10 shrink-0 place-items-center rounded-xl',
                    on ? 'bg-accent/15 text-accent' : 'bg-surface-3 text-fg-faint',
                  )}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-[13px] font-semibold text-fg">
                    {label}
                    {on && <Badge color="#fbbf24">configured</Badge>}
                  </div>
                  <div className="truncate text-[11px] text-fg-faint">{hint}</div>
                </div>
                <Switch on={on} onClick={() => toggleIntegration(id)} />
              </Card>
            )
          })}
        </div>
      </Section>

      {/* Automation rules */}
      <Section
        title="Automation rules"
        subtitle={`${activeRules} of ${rules.length} enabled locally`}
        action={
          <Badge color="#fbbf24">
            <Zap className="h-3 w-3" />
            preview only
          </Badge>
        }
      >
        <p className="mb-3 text-[12px] text-fg-faint">
          Rules are saved locally for now; no automation is executed until a backend worker is connected.
        </p>
        <Card className="overflow-hidden">
          {/* Add form */}
          <div className="flex flex-col gap-2 border-b border-border p-4 sm:flex-row sm:items-center">
            <span className="text-[12px] font-semibold uppercase tracking-wide text-fg-faint sm:w-14">When</span>
            <input
              value={when}
              onChange={(e) => setWhen(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitRule()}
              placeholder="cpu > 90% for 2m"
              className="flex-1 rounded-lg border border-border bg-surface-2 px-3 py-2 text-[13px] text-fg outline-none placeholder:text-fg-faint focus:border-fg-faint"
            />
            <span className="text-[12px] font-semibold uppercase tracking-wide text-fg-faint sm:w-10">Then</span>
            <input
              value={then}
              onChange={(e) => setThen(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitRule()}
              placeholder="restart + notify Slack"
              className="flex-1 rounded-lg border border-border bg-surface-2 px-3 py-2 text-[13px] text-fg outline-none placeholder:text-fg-faint focus:border-fg-faint"
            />
            <Button variant="primary" size="sm" onClick={submitRule} disabled={!when.trim() || !then.trim()}>
              <Plus className="h-3.5 w-3.5" />
              Add
            </Button>
          </div>

          <ul>
            {rules.length === 0 && (
              <li className="px-5 py-8 text-center text-[13px] text-fg-faint">No rules yet. Add one above.</li>
            )}
            {rules.map((r, i) => (
              <li
                key={r.id}
                className={cn(
                  'flex items-center gap-3 px-5 py-3.5',
                  i > 0 && 'border-t border-border-soft',
                  !r.enabled && 'opacity-50',
                )}
              >
                <Switch on={r.enabled} onClick={() => toggleRule(r.id)} />
                <div className="min-w-0 flex-1 text-[13px]">
                  <span className="text-fg-faint">when </span>
                  <span className="font-medium text-fg">{r.when}</span>
                  <span className="text-fg-faint"> then </span>
                  <span className="font-medium text-accent">{r.then}</span>
                </div>
                <button
                  onClick={() => removeRule(r.id)}
                  aria-label="delete rule"
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-fg-faint transition-colors hover:bg-danger/10 hover:text-danger"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </Card>
      </Section>
    </div>
  )
}

function Row({ label, hint, children }: { label: string; hint: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="text-[13px] font-semibold text-fg">{label}</div>
        <div className="text-[11px] text-fg-faint">{hint}</div>
      </div>
      {children}
    </div>
  )
}
