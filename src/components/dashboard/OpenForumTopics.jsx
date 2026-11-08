// src/components/dashboard/OpenForumTopics.jsx
//
// Açık (çözülmemiş) forum konuları.
// Kaynak: GET /forum/topics?status=open
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { MessageSquare } from 'lucide-react';
import SectionCard from './SectionCard';
import WidgetList from './WidgetList';
import { relativeTime } from '../../utils/forum';

export default function OpenForumTopics() {
  const navigate = useNavigate();
  const { overview, overviewLoading } = useSelector((s) => s.dashboard);
  const { items, total, error } = overview.forum;

  const rows = (items || []).map((topic) => ({
    key: topic.id,
    icon: MessageSquare,
    title: topic.title,
    meta: `${topic.author_name || 'Anonim'} · ${relativeTime(topic.created_at)}${
      topic.machine_label ? ` · ${topic.machine_label}` : ''
    }`,
    value: `${topic.comments_count} yorum`,
    tone: 'blue',
    onClick: () => navigate('/forum'),
  }));

  return (
    <SectionCard
      title="Açık Forum Konuları"
      subtitle={`${total} konu çözüm bekliyor`}
      icon={MessageSquare}
      action={{ label: 'Tümü', onClick: () => navigate('/forum') }}
      loading={overviewLoading}
      error={error}
      empty={rows.length === 0}
      emptyIcon={MessageSquare}
      emptyText="Açık konu yok"
      emptyHint="Tüm forum konuları çözülmüş görünüyor"
      bodyClassName="overflow-y-auto"
    >
      <WidgetList rows={rows} />
    </SectionCard>
  );
}
