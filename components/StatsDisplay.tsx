'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import ReactCountryFlag from 'react-country-flag'
import { useTranslations } from 'next-intl'
import StatIndicator from './StatIndicator'
import { formatStatValue } from '@/lib/statsThresholds'

interface StatsDisplayProps {
  stats: {
    player: {
      nickname: string
      avatar: string
      country: string
      steam_id_64: string
      faceit_url: string
    }
    games: {
      cs2?: {
        faceit_elo: number
        game_player_id: string
        game_player_name: string
        game_profile_id: string
        region: string
        skill_level: number
      }
    }
    lifetime: {
      'Average K/D Ratio': string
      'Average Headshots %': string
      'Average Damage per Round'?: string
      'Average Damage'?: string
      'ADR'?: string
      'Matches': string
      'Wins': string
      'Win Rate %': string
      [key: string]: string | undefined
    }
    segments?: Array<{
      label: string
      stats: Record<string, string>
    }>
    recentMatchesStats?: Array<{
      stats: Record<string, string | number>
    }>
  }
  matchesLimit?: number
  setMatchesLimit?: (limit: number) => void
}

export default function StatsDisplay({ stats, matchesLimit = 30, setMatchesLimit }: StatsDisplayProps) {
  const t = useTranslations()
  const [expandedMaps, setExpandedMaps] = useState<Set<string>>(new Set())
  const cs2Stats = stats.games?.cs2
  const lifetime = stats.lifetime || {}
  
  // Ищем ADR в разных вариантах названий
  const adrKey = Object.keys(lifetime).find(key => {
    const lowerKey = key.toLowerCase()
    return lowerKey.includes('damage') && (lowerKey.includes('round') || lowerKey.includes('adr'))
  })
  const adrValue = lifetime['Average Damage per Round'] || 
                   lifetime['Average Damage'] || 
                   lifetime['ADR'] ||
                   lifetime['Average Damage/Round'] ||
                   (adrKey ? lifetime[adrKey] : null)
  
  // Агрегируем статистику за последние матчи из готовых данных API
  const recentStats = useMemo(() => {
    if (!stats.recentMatchesStats || stats.recentMatchesStats.length === 0) {
      return null
    }
    
    const items = stats.recentMatchesStats
    let totalKills = 0
    let totalDeaths = 0
    let totalHeadshots = 0
    let totalKillsForHS = 0
    let totalDamage = 0
    let totalRounds = 0
    let wins = 0
    let matchesWithStats = 0
    
    items.forEach((item: any) => {
      const matchStats = item.stats
      if (!matchStats || typeof matchStats !== 'object') return
      
      matchesWithStats++
      
      // Получаем данные из stats напрямую
      const kills = parseFloat(String(matchStats.Kills || matchStats['Kills'] || '0').replace(/[^\d.]/g, '')) || 0
      const deaths = parseFloat(String(matchStats.Deaths || matchStats['Deaths'] || '0').replace(/[^\d.]/g, '')) || 0
      const headshotsStr = String(matchStats['Headshots'] || matchStats['Headshots %'] || '0')
      const headshots = parseFloat(headshotsStr.replace(/[^\d.]/g, '')) || 0
      const rounds = parseFloat(String(matchStats['Rounds'] || matchStats.Rounds || '0').replace(/[^\d.]/g, '')) || 0
      const adr = parseFloat(String(matchStats['ADR'] || matchStats.ADR || '0').replace(/[^\d.]/g, '')) || 0
      const damage = parseFloat(String(matchStats['Damage'] || matchStats.Damage || '0').replace(/[^\d.]/g, '')) || 0
      
      // Проверяем победу через поле Result
      const result = matchStats['Result'] || matchStats.Result
      if (result === '1' || result === 1) {
        wins++
      }
      
      totalKills += kills
      totalDeaths += deaths
      
      // Для урона: если есть ADR, используем его * rounds, иначе Damage
      if (adr > 0 && rounds > 0) {
        totalDamage += adr * rounds
      } else if (damage > 0) {
        totalDamage += damage
      }
      totalRounds += rounds || 1
      
      // Headshots: если есть Headshots %, используем его, иначе вычисляем из Headshots
      if (matchStats['Headshots %'] !== undefined) {
        const hsPercent = parseFloat(String(matchStats['Headshots %']).replace(/[^\d.]/g, '')) || 0
        totalHeadshots += (kills * hsPercent) / 100
        totalKillsForHS += kills
      } else if (headshotsStr.includes('%')) {
        totalHeadshots += (kills * headshots) / 100
        totalKillsForHS += kills
      } else {
        totalHeadshots += headshots
        totalKillsForHS += kills
      }
    })
    
    const kd = totalDeaths > 0 ? totalKills / totalDeaths : (totalKills > 0 ? totalKills : 0)
    const headshotPercent = totalKillsForHS > 0 ? (totalHeadshots / totalKillsForHS) * 100 : 0
    const winRate = items.length > 0 ? (wins / items.length) * 100 : 0
    const avgKills = matchesWithStats > 0 ? totalKills / matchesWithStats : 0
    const avgDeaths = matchesWithStats > 0 ? totalDeaths / matchesWithStats : 0
    const adr = totalRounds > 0 ? totalDamage / totalRounds : 0
    
    return {
      matches: items.length,
      kd: kd.toFixed(2),
      headshot: headshotPercent.toFixed(1),
      winRate: winRate.toFixed(1),
      avgKills: avgKills.toFixed(1),
      avgDeaths: avgDeaths.toFixed(1),
      adr: adr.toFixed(1),
      wins: wins,
    }
  }, [stats.recentMatchesStats])
  
  // Если ADR не найден в lifetime, используем из recentStats
  const computedAdr = useMemo(() => {
    if (adrValue) return null // Если уже есть, не вычисляем
    
    if (recentStats && recentStats.adr) {
      return recentStats.adr
    }
    
    return null
  }, [adrValue, recentStats])
  
  // Используем найденный или вычисленный ADR
  const finalAdr = adrValue || computedAdr
  
  // Код страны игрока (например, 'RU') для компонента флага
  const countryCode = stats.player.country ? String(stats.player.country).toUpperCase() : null

  // Фильтруем сегменты - карты отдельно
  const mapSegments = stats.segments?.filter(seg => 
    seg.label && (
      seg.label.toLowerCase().includes('mirage') ||
      seg.label.toLowerCase().includes('dust') ||
      seg.label.toLowerCase().includes('inferno') ||
      seg.label.toLowerCase().includes('ancient') ||
      seg.label.toLowerCase().includes('anubis') ||
      seg.label.toLowerCase().includes('vertigo') ||
      seg.label.toLowerCase().includes('overpass') ||
      seg.label.toLowerCase().includes('nuke') ||
      seg.label.toLowerCase().includes('cache') ||
      seg.label.toLowerCase().includes('train')
    )
  ) || []
  
  const otherSegments = stats.segments?.filter(seg => 
    !mapSegments.includes(seg)
  ) || []

  const toggleMap = (mapLabel: string) => {
    const newExpanded = new Set(expandedMaps)
    if (newExpanded.has(mapLabel)) {
      newExpanded.delete(mapLabel)
    } else {
      newExpanded.add(mapLabel)
    }
    setExpandedMaps(newExpanded)
  }

  return (
    <div className="card">
      <div style={{
        display: 'flex',
        textAlign: 'center',
        marginBottom: '2rem',
        flexWrap: 'wrap',
        flexDirection: 'row',
        alignContent: 'center',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1rem'
      }}>
        {stats.player.avatar && (
          <a target="_blank"
          rel="noopener noreferrer" href={stats.player.avatar}>
            <Image
              src={stats.player.avatar}
              alt={stats.player.nickname}
              width={100}
              height={100}
              style={{
                borderRadius: '50%',
                marginBottom: '1rem',
                objectFit: 'cover',
                flexShrink: 0,
              }}
              loading="lazy"
              unoptimized={!stats.player.avatar.includes('faceit-cdn')}
            />
          </a>
        )}
        <div>
          {stats.player.faceit_url ? (
            <a
              href={stats.player.faceit_url}
              target="_blank"
              rel="noopener noreferrer"
              title="Faceit profile"
              className="hover:text-underline"
              style={{ 
                fontSize: '2rem', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '0.5rem', 
                color: '#ffffff',
                wordBreak: 'break-word',
                textAlign: 'center'
              }}
            >
              {stats.player.nickname}
            </a>
          ) : 
            <h2 style={{ 
              fontSize: '2rem', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '0.5rem', 
              color: '#ffffff',
              wordBreak: 'break-word',
              textAlign: 'center'
            }}>
              {stats.player.nickname}
            </h2>
          }
          {
            stats.player.steam_id_64 && (
              <a
                href={`https://steamcommunity.com/profiles/${stats.player.steam_id_64}`}
                target="_blank"
                rel="noopener noreferrer"
                title="Steam profile"
                className="hover:text-underline text-sm text-gray-500"
              >
                {stats.player.steam_id_64}
              </a>
            )
          }
          
        </div>
        
        {countryCode ? (
          <ReactCountryFlag
            countryCode={countryCode}
            svg
            style={{ width: '1.5rem', height: '1.5rem', borderRadius: '2px' }}
          />
        ) : <span></span>}
      </div>

      {cs2Stats && (
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ 
            fontSize: '1.5rem', 
            marginBottom: '1rem', 
            color: '#ffffff',
            wordBreak: 'break-word'
          }}>
            {t('cs2Stats')}
          </h3>
          <div className="stats-grid">
            <div className="stat-card">
              <h3>{t('elo')}</h3>
              <div className="value">
                <span>{cs2Stats.faceit_elo || 'N/A'}</span>
                {cs2Stats.faceit_elo && <StatIndicator value={cs2Stats.faceit_elo} type="elo" />}
              </div>
            </div>
            <div className="stat-card">
              <h3>{t('level')}</h3>
              <div className="value">{cs2Stats.skill_level || 'N/A'}</div>
            </div>
            <div className="stat-card">
              <h3>{t('region')}</h3>
              <div className="value">{cs2Stats.region || 'N/A'}</div>
            </div>
          </div>
        </div>
      )}

      {recentStats && (
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '1rem',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <h3 style={{ 
              fontSize: '1.5rem', 
              color: '#ffffff', 
              margin: 0,
              flex: 1,
              minWidth: '200px'
            }}>
              {t('recentMatches')} ({recentStats.matches})
            </h3>
            {setMatchesLimit && (
              <select
                value={matchesLimit}
                onChange={(e) => setMatchesLimit(Number(e.target.value))}
                style={{
                  background: '#1a1a1a',
                  color: '#ffffff',
                  border: '1px solid #333333',
                  borderRadius: '6px',
                  padding: '0.5rem 1rem',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  flexShrink: 0
                }}
              >
                <option value={10}>{t('matches10')}</option>
                <option value={20}>{t('matches20')}</option>
                <option value={30}>{t('matches30')}</option>
              </select>
            )}
          </div>
          <div className="stats-grid">
            <div className="stat-card">
              <h3>{t('matches')}</h3>
              <div className="value">{recentStats.matches}</div>
            </div>
            <div className="stat-card">
              <h3>{t('wins')}</h3>
              <div className="value">{recentStats.wins}</div>
            </div>
            <div className="stat-card">
              <h3>{t('winRate')}</h3>
              <div className="value">
                <span>{recentStats.winRate}%</span>
                <StatIndicator value={parseFloat(recentStats.winRate)} type="winRate" />
              </div>
            </div>
            <div className="stat-card">
              <h3>{t('kd')}</h3>
              <div className="value">
                <span>{recentStats.kd}</span>
                <StatIndicator value={parseFloat(recentStats.kd)} type="kd" />
              </div>
            </div>
            <div className="stat-card">
              <h3>{t('headshots')}</h3>
              <div className="value">
                <span>{recentStats.headshot}%</span>
                <StatIndicator value={parseFloat(recentStats.headshot)} type="headshot" />
              </div>
            </div>
            <div className="stat-card">
              <h3>{t('adr')}</h3>
              <div className="value">
                <span>{recentStats.adr}</span>
                <StatIndicator value={parseFloat(recentStats.adr)} type="adr" />
              </div>
            </div>
            <div className="stat-card">
              <h3>{t('avgKills')}</h3>
              <div className="value">{recentStats.avgKills}</div>
            </div>
            <div className="stat-card">
              <h3>{t('avgDeaths')}</h3>
              <div className="value">{recentStats.avgDeaths}</div>
            </div>
          </div>
        </div>
      )}

      {Object.keys(lifetime).length > 0 && (
        <div>
          <h3 style={{ 
            fontSize: '1.5rem', 
            marginBottom: '1rem', 
            color: '#ffffff',
            wordBreak: 'break-word'
          }}>
            {t('generalStats')}
          </h3>
          <div className="stats-grid">
            {lifetime['Matches'] && (
              <div className="stat-card">
                <h3>{t('matches')}</h3>
                <div className="value">{lifetime['Matches']}</div>
              </div>
            )}
            {lifetime['Wins'] && (
              <div className="stat-card">
                <h3>{t('wins')}</h3>
                <div className="value">{lifetime['Wins']}</div>
              </div>
            )}
            {lifetime['Win Rate %'] && (
              <div className="stat-card">
                <h3>{t('winRate')}</h3>
                <div className="value">
                  <span>{lifetime['Win Rate %']}%</span>
                  <StatIndicator value={formatStatValue(lifetime['Win Rate %'])} type="winRate" />
                </div>
              </div>
            )}
            {lifetime['Average K/D Ratio'] && (
              <div className="stat-card">
                <h3>{t('kd')}</h3>
                <div className="value">
                  <span>{lifetime['Average K/D Ratio']}</span>
                  <StatIndicator value={formatStatValue(lifetime['Average K/D Ratio'])} type="kd" />
                </div>
              </div>
            )}
            {lifetime['Average Headshots %'] && (
              <div className="stat-card">
                <h3>{t('headshots')}</h3>
                <div className="value">
                  <span>{lifetime['Average Headshots %']}%</span>
                  <StatIndicator value={formatStatValue(lifetime['Average Headshots %'])} type="headshot" />
                </div>
              </div>
            )}
            {finalAdr && (
              <div className="stat-card">
                <h3>{t('adr')}</h3>
                <div className="value">
                  <span>{finalAdr}</span>
                  <StatIndicator 
                    value={formatStatValue(finalAdr || '0')} 
                    type="adr" 
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {mapSegments.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <h3 style={{ 
            fontSize: '1.5rem', 
            marginBottom: '1rem', 
            color: '#ffffff',
            wordBreak: 'break-word'
          }}>
            {t('additionalStats')}
          </h3>
          {mapSegments.map((segment, index) => {
            const isExpanded = expandedMaps.has(segment.label)
            return (
              <div key={index} style={{ marginBottom: '0.5rem' }}>
                <button
                  onClick={() => toggleMap(segment.label)}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    background: '#1a1a1a',
                    border: '1px solid #333',
                    borderRadius: '8px',
                    color: '#ffffff',
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#2a2a2a'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#1a1a1a'
                  }}
                >
                  <span>{segment.label}</span>
                  <span style={{ fontSize: '1.5rem', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                    ▼
                  </span>
                </button>
                {isExpanded && (
                  <div
                    style={{
                      marginTop: '0.5rem',
                      padding: '1rem',
                      background: '#0a0a0a',
                      border: '1px solid #333',
                      borderRadius: '8px',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                      gap: '1rem',
                    }}
                  >
                    {Object.entries(segment.stats).map(([key, value]) => (
                      <div
                        key={key}
                        style={{
                          padding: '0.75rem',
                          background: '#1a1a1a',
                          borderRadius: '6px',
                          border: '1px solid #333',
                          color: '#ffffff',
                        }}
                      >
                        <strong>{key}:</strong> {value}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {otherSegments.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          {otherSegments.map((segment, index) => (
            <div key={`other-${index}`} style={{ marginBottom: '1rem' }}>
              <h4 style={{ marginBottom: '0.5rem', color: '#fff', fontSize: '1.2rem' }}>
                {segment.label}
              </h4>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: '1rem',
                }}
              >
                {Object.entries(segment.stats).map(([key, value]) => (
                  <div
                    key={key}
                    style={{
                      padding: '0.75rem',
                      background: '#1a1a1a',
                      borderRadius: '6px',
                      border: '1px solid #333',
                      color: '#ffffff',
                    }}
                  >
                    <strong>{key}:</strong> {value}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

