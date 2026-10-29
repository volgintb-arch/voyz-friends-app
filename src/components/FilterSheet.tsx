import React, { useState } from 'react';
import { View } from 'react-native';
import type { SearchFilters } from '../domain/model';
import { emptyFilters } from '../domain/model';
import { isDate } from '../domain/commands';
import { Button, Check, Chip, Field, Sheet, T, ui } from './UI';
import { useStore } from '../state/Store';
type Props = { visible: boolean; filters: SearchFilters; onApply: (f: SearchFilters) => void; onClose: () => void };
export function FilterSheet(props: Props) { return props.visible ? <FilterForm {...props} /> : null; }
function FilterForm({ visible, filters, onApply, onClose }: Props) {
  const [f, setF] = useState(filters); const { tell } = useStore();
  const patch = (v: Partial<SearchFilters>) => setF(old => ({ ...old, ...v }));
  const submit = () => { if ((f.from && !isDate(f.from)) || (f.to && !isDate(f.to)) || (f.from && f.to && f.to < f.from)) { tell('Проверьте период в формате ГГГГ-ММ-ДД.'); return; } if (f.maxBudget && (!Number.isFinite(+f.maxBudget) || +f.maxBudget < 0)) { tell('Проверьте бюджет.'); return; } onApply(f); onClose(); };
  return <Sheet visible={visible} title="Настроить поиск" onClose={onClose}><T>Язык общения</T><View style={ui.wrap}>{['', 'Русский', 'Кыргызский', 'English'].map(l => <Chip key={l} label={l || 'Любой'} selected={l === f.language} onPress={() => patch({ language: l })} />)}</View><Field label="Не раньше · ГГГГ-ММ-ДД" value={f.from} onChange={from => patch({ from })} placeholder="2026-11-01" /><Field label="Не позднее · ГГГГ-ММ-ДД" value={f.to} onChange={to => patch({ to })} placeholder="2026-11-15" /><Field label="Бюджет до, сом" value={f.maxBudget} numeric onChange={maxBudget => patch({ maxBudget })} /><Check label="Включать бюджет «обсудим»" checked={f.unknownBudget} onPress={() => patch({ unknownBudget: !f.unknownBudget })} /><T>Состав компании</T><View style={ui.wrap}>{([['', 'Любой'], ['mixed', 'Смешанная'], ['female', 'Женская'], ['male', 'Мужская']] as const).map(([value, label]) => <Chip key={value} label={label} selected={f.composition === value} onPress={() => patch({ composition: value })} />)}</View><Field label="Длительность до, дней" value={f.maxDuration} numeric onChange={maxDuration => patch({ maxDuration })} /><Button label="Показать результаты" onPress={submit} /><Button label="Сбросить фильтры" variant="secondary" onPress={() => { onApply({ ...emptyFilters }); onClose(); }} /></Sheet>;
}
