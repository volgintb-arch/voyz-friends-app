import React, { useState } from 'react';
import { View } from 'react-native';
import { Button, Chip, Field, Sheet, T, ui } from './UI';
import { useStore } from '../state/Store';
export function ReportSheet({ targetId, onClose }: { targetId: string | null; onClose: () => void }) {
  const { run } = useStore(); const [category, setCategory] = useState('Условия поездки'); const [text, setText] = useState('');
  return <Sheet visible={!!targetId} title="Обращение в поддержку" onClose={onClose}><View style={ui.wrap}>{['Условия поездки', 'Спам', 'Мошенничество', 'Нежелательные знакомства', 'Угрозы', 'Другое'].map(c => <Chip key={c} label={c} selected={c === category} onPress={() => setCategory(c)} />)}</View><Field label="Что произошло?" value={text} onChange={setText} multiline /><T style={ui.copy}>Это демонстрация. Обращение сохранится на устройстве, команда поддержки его не получит.</T><Button label="Сохранить демо-обращение" onPress={() => { if (run({ type: 'REPORT', targetId: targetId!, category, text }, 'Демо-обращение сохранено.')) { setText(''); onClose(); } }} /></Sheet>;
}
