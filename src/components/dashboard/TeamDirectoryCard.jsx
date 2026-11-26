// src/components/dashboard/TeamDirectoryCard.jsx
//
// Dashboard'daki küçük kullanıcı tablosu: profil fotoğrafı, ad soyad ve
// e-posta. Veri `fetchTeamMembers` (`GET /users/team`) üzerinden gelir; header
// avatar yığınıyla (`TeamAvatarStack`) aynı listeyi paylaşır. Fotoğrafı
// olmayanlar baş harflerine düşer; kırık bir URL baş harflere geri döner.
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Users } from 'lucide-react';

import SectionCard from './SectionCard';
import { fetchTeamMembers } from '../../stores/user_slice';
import { avatarTone } from '../../utils/forum';
import { buildFullName, buildInitials } from '../../utils/formatName';
import { TABLE_HEAD } from '../ui/tableStyles';

function memberName(member) {
  // Names are stored lowercase; `buildFullName` applies Turkish Title-Case.
  return (
    buildFullName(member.firstname, member.lastname) ||
    member.full_name ||
    'Kullanıcı'
  );
}

export default function TeamDirectoryCard({ className = '' }) {
  const dispatch = useDispatch();
  const { team = [], teamTotal = 0, teamLoading = false, teamError = '' } =
    useSelector((state) => state.auth);

  // Bir fotoğraf 404 dönebilir (silinmiş nesne / süresi geçmiş URL): o kişi
  // için baş harflere düşeriz. URL bazında tutulur, yeni yüklenen foto tekrar
  // denenir.
  const [failedUrls, setFailedUrls] = useState([]);
  const markFailed = (url) =>
    setFailedUrls((previous) =>
      previous.includes(url) ? previous : [...previous, url]
    );

  const hiddenCount = Math.max((teamTotal || team.length) - team.length, 0);

  return (
    <SectionCard
      title="Kullanıcılar"
      subtitle={teamTotal ? `${teamTotal} kullanıcı` : 'Ekip dizini'}
      icon={Users}
      loading={teamLoading && team.length === 0}
      error={teamError}
      onRetry={() => dispatch(fetchTeamMembers())}
      empty={team.length === 0}
      emptyIcon={Users}
      emptyText="Kullanıcı bulunamadı"
      emptyHint="Ekip listesi yüklendiğinde burada görünecek"
      className={className}
      bodyClassName="px-0 py-0"
    >
      <div className="h-full overflow-y-auto">
        <table className="w-full table-fixed border-separate border-spacing-0 text-left">
          <thead className="sticky top-0 z-10">
            <tr>
              <th
                scope="col"
                className={`${TABLE_HEAD} w-12 border-b border-slate-200 px-3 py-2 backdrop-blur`}
              >
                <span className="sr-only">Fotoğraf</span>
              </th>
              <th
                scope="col"
                className={`${TABLE_HEAD} border-b border-slate-200 px-2 py-2 backdrop-blur`}
              >
                Ad Soyad
              </th>
              <th
                scope="col"
                className={`${TABLE_HEAD} w-[45%] border-b border-slate-200 px-3 py-2 backdrop-blur`}
              >
                E-posta
              </th>
            </tr>
          </thead>

          <tbody>
            {team.map((member) => {
              const name = memberName(member);
              const email = member.email || '';
              const hasPhoto =
                Boolean(member.image_url) && !failedUrls.includes(member.image_url);

              return (
                <tr
                  key={member.id}
                  className="transition-colors hover:bg-slate-50/70"
                >
                  <td className="border-b border-slate-100 px-3 py-2">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full ring-1 ring-slate-200">
                      {hasPhoto ? (
                        <img
                          src={member.image_url}
                          alt={name}
                          loading="lazy"
                          onError={() => markFailed(member.image_url)}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span
                          className={`flex h-full w-full items-center justify-center text-[11px] font-semibold ${avatarTone(
                            member.full_name || name
                          )}`}
                        >
                          {buildInitials(member.firstname, member.lastname) || (
                            <Users className="h-3.5 w-3.5" />
                          )}
                        </span>
                      )}
                    </span>
                  </td>

                  <td className="border-b border-slate-100 px-2 py-2">
                    <p
                      className="truncate text-[13px] font-semibold text-slate-900"
                      title={name}
                    >
                      {name}
                      {member.is_self && (
                        <span className="ml-1 rounded bg-blue-50 px-1 py-0.5 align-middle text-[9px] font-semibold text-blue-600">
                          siz
                        </span>
                      )}
                    </p>
                  </td>

                  <td className="border-b border-slate-100 px-3 py-2">
                    {email ? (
                      <a
                        href={`mailto:${email}`}
                        title={email}
                        className="block truncate text-[11px] text-slate-500 transition hover:text-blue-600"
                      >
                        {email}
                      </a>
                    ) : (
                      <span className="text-[11px] text-slate-300">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>

          {hiddenCount > 0 && (
            <tfoot>
              <tr>
                <td
                  colSpan={3}
                  className="sticky bottom-0 border-t border-slate-200 bg-white/95 px-3 py-2 text-center text-[11px] font-medium text-slate-400 backdrop-blur"
                >
                  +{hiddenCount} kullanıcı daha
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </SectionCard>
  );
}
