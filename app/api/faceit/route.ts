import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

const FACEIT_API_BASE = 'https://open.faceit.com/data/v4'

// Получение заголовков для API запросов
function getApiHeaders() {
    const apiKey = process.env.FACEIT_API_KEY
    if (!apiKey) {
    return {}
    }
    return {
    Authorization: `Bearer ${apiKey}`,
    }
}

// Извлечение Steam ID из различных форматов ссылок
function extractSteamId(input: string): string | null {
    const trimmedInput = input.trim()
    
    // Steam ID64 из прямой строки (если это просто число)
    if (/^\d{17}$/.test(trimmedInput)) {
        return trimmedInput
    }

    // Пытаемся распарсить как URL
    try {
        // Добавляем протокол, если его нет
        const urlString = trimmedInput.startsWith('http://') || trimmedInput.startsWith('https://')
            ? trimmedInput
            : `https://${trimmedInput}`
        
        const url = new URL(urlString)
        
        // Проверяем, является ли это Steam профилем
        if (url.hostname === 'steamcommunity.com' || url.hostname.endsWith('.steamcommunity.com')) {
            // Формат: /profiles/76561198012345678
            const profilesMatch = url.pathname.match(/^\/profiles\/(\d+)$/)
            if (profilesMatch) {
                return profilesMatch[1]
            }
            
            // Формат: /id/customname (не поддерживается напрямую, но можем попробовать)
            // Для этого нужен дополнительный запрос к Steam API
        }
    } catch (error) {
        // Не является валидным URL, игнорируем ошибку
    }

    return null
}

// Получение Faceit player_id по Steam ID
async function getPlayerIdBySteamId(steamId: string): Promise<string | null> {
    try {
        const response = await axios.get(
        `${FACEIT_API_BASE}/players?game=cs2&game_player_id=${steamId}`,
        {
            headers: getApiHeaders(),
        }
        )
        return response.data?.player_id || null
    } catch (error: any) {
        if (error.response?.status === 404) {
        return null
        }
        throw error
    }
}

// Получение статистики игрока
async function getPlayerStats(playerId: string, matchesLimit?: number) {
    const headers = getApiHeaders()
    const [playerInfo, playerStats] = await Promise.all([
        axios.get(`${FACEIT_API_BASE}/players/${playerId}`, {
        headers,
        }),
        axios.get(`${FACEIT_API_BASE}/players/${playerId}/stats/cs2`, {
        headers,
        }),
    ])

    // Получаем статистику за последние N матчей если указан лимит
    let recentMatchesStats = null
    if (matchesLimit) {
        try {
            // Используем правильный endpoint для получения статистики по матчам
            const statsResponse = await axios.get(
                `${FACEIT_API_BASE}/players/${playerId}/games/cs2/stats?limit=${matchesLimit}`,
                { headers }
            )
            recentMatchesStats = statsResponse.data?.items || []
        } catch (error) {
            console.error('Failed to fetch recent matches stats:', error)
            // Fallback на старый endpoint если новый не работает
            try {
                const matchesResponse = await axios.get(
                    `${FACEIT_API_BASE}/players/${playerId}/history?game=cs2&limit=${matchesLimit}`,
                    { headers }
                )
                recentMatchesStats = matchesResponse.data?.items || []
            } catch (fallbackError) {
                console.error('Failed to fetch recent matches (fallback):', fallbackError)
            }
        }
    }

    // Формируем правильный URL профиля
    const playerData = playerInfo.data
    let faceitUrl = playerData.faceit_url || `https://www.faceit.com/en/players/${playerData.nickname}`
    
    // Заменяем {lang} плейсхолдер на реальный язык
    if (faceitUrl.includes('{lang}')) {
        faceitUrl = faceitUrl.replace('{lang}', 'en')
    }
    
    return {
        player: {
            ...playerData,
            faceit_url: faceitUrl,
        },
        games: playerData.games,
        lifetime: playerStats.data?.lifetime || {},
        segments: playerStats.data?.segments || [],
        recentMatchesStats: recentMatchesStats,
    }
}

// Настройка кеширования для API
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(request: NextRequest) {
  try {
    const { input, matchesLimit } = await request.json()

        if (!input || typeof input !== 'string') {
        return NextResponse.json(
            { error: 'Неверный формат входных данных' },
            { status: 400 }
        )
    }

    let playerId: string | null = null

    // Проверяем, является ли ввод Steam ID/ссылкой
    const steamId = extractSteamId(input)
    if (steamId) {
      // Пытаемся найти игрока по Steam ID
        playerId = await getPlayerIdBySteamId(steamId)
        if (!playerId) {
            return NextResponse.json(
            { error: 'Игрок с таким Steam ID не найден в Faceit' },
            { status: 404 }
            )
        }
        } else {
        // Предполагаем, что это никнейм Faceit
        try {
            const response = await axios.get(
            `${FACEIT_API_BASE}/players?nickname=${encodeURIComponent(input)}`,
            {
                headers: getApiHeaders(),
            }
            )
            playerId = response.data?.player_id || null
        } catch (error: any) {
            if (error.response?.status === 404) {
            return NextResponse.json(
                { error: 'Игрок с таким никнеймом не найден' },
                { status: 404 }
            )
            }
            throw error
        }
    }

    if (!playerId) {
        return NextResponse.json(
            { error: 'Игрок не найден' },
            { status: 404 }
        )
        }

        // Получаем статистику
        const stats = await getPlayerStats(playerId, matchesLimit || 30)

        return NextResponse.json(stats)
    } catch (error: any) {
        console.error('Faceit API Error:', error.response?.data || error.message)

        if (error.response?.status === 401) {
        return NextResponse.json(
            {
            error:
                'Ошибка авторизации API. Убедитесь, что FACEIT_API_KEY установлен в переменных окружения.',
            },
            { status: 500 }
        )
    }

    if (error.response?.status === 404) {
        return NextResponse.json(
            { error: 'Игрок не найден' },
            { status: 404 }
        )
        }

        if (error.response?.status === 429) {
        return NextResponse.json(
            { error: 'Превышен лимит запросов к API. Попробуйте позже.' },
            { status: 429 }
        )
    }

    return NextResponse.json(
        {
            error:
            error.response?.data?.error?.message ||
            'Ошибка при получении статистики',
        },
        { status: error.response?.status || 500 }
        )
    }
}

