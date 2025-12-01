import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

const FACEIT_API_BASE = 'https://open.faceit.com/data/v4'
const STEAM_API_BASE = 'https://api.steampowered.com'

const REQUIRED_ENV_VARS = ['FACEIT_API_KEY', 'STEAM_API_KEY'] as const

function validateEnv() {
    if (process.env.NODE_ENV === 'production') {
        for (const key of REQUIRED_ENV_VARS) {
            if (!process.env[key]) {
                throw new Error(`Missing required env variable ${key} in production`)
            }
        }
    }
}

validateEnv()

// Настройка axios с таймаутами для оптимизации
const axiosInstance = axios.create({
  timeout: 10000, // 10 секунд таймаут
    headers: {
        'Content-Type': 'application/json',
    },
})

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

// Извлечение Steam ID из различных форматов ссылок (без учёта vanity URL)
function extractSteamId(input: string): string | null {
    const trimmedInput = input.trim()

    // Если в строке вообще есть SteamID64 (17 цифр подряд) — забираем его
    const idMatch = trimmedInput.match(/\b\d{17}\b/)
    if (idMatch) {
        return idMatch[0]
    }

    // Пытаемся распарсить как URL и достать ID из /profiles/
    try {
        const urlString = trimmedInput.startsWith('http://') || trimmedInput.startsWith('https://')
            ? trimmedInput
            : `https://${trimmedInput}`

        const url = new URL(urlString)

        if (url.hostname === 'steamcommunity.com' || url.hostname.endsWith('.steamcommunity.com')) {
            const profilesMatch = url.pathname.match(/^\/profiles\/(\d+)/)
            if (profilesMatch) {
                return profilesMatch[1]
            }
        }
    } catch {
        // Не является валидным URL, игнорируем ошибку
    }

    return null
}

// Разрешение vanity URL вида /id/customname в SteamID64
async function resolveVanityUrlToSteamId(vanity: string): Promise<string | null> {
    const apiKey = process.env.STEAM_API_KEY
    if (!apiKey) {
        console.error('STEAM_API_KEY is not set')
        return null
    }

    try {
        const response = await axiosInstance.get(
            `${STEAM_API_BASE}/ISteamUser/ResolveVanityURL/v1/`,
            {
                params: {
                    key: apiKey,
                    vanityurl: vanity,
                },
            }
        )

        const data = response.data?.response
        if (data?.success === 1 && data.steamid) {
            return data.steamid as string
        }

        return null
    } catch (error) {
        console.error('Failed to resolve Steam vanity URL:', error)
        return null
    }
}

// Получение Faceit player_id по Steam ID
async function getPlayerIdBySteamId(steamId: string): Promise<string | null> {
    try {
        const response = await axiosInstance.get(
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
        axiosInstance.get(`${FACEIT_API_BASE}/players/${playerId}`, {
        headers,
        }),
        axiosInstance.get(`${FACEIT_API_BASE}/players/${playerId}/stats/cs2`, {
        headers,
        }),
    ])

    // Получаем статистику за последние N матчей если указан лимит
    let recentMatchesStats = null
    if (matchesLimit) {
        try {
            // Используем правильный endpoint для получения статистики по матчам
            const statsResponse = await axiosInstance.get(
                `${FACEIT_API_BASE}/players/${playerId}/games/cs2/stats?limit=${matchesLimit}`,
                { headers }
            )
            recentMatchesStats = statsResponse.data?.items || []
        } catch (error) {
            console.error('Failed to fetch recent matches stats:', error)
            // Fallback на старый endpoint если новый не работает
            try {
                const matchesResponse = await axiosInstance.get(
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

    const trimmedInput = input.trim()

    // 1) Пробуем вытащить SteamID64 из строки (число или /profiles/...)
    let steamId = extractSteamId(trimmedInput)

    // 2) Если не нашли, но это ссылка вида /id/<vanity>, пробуем спросить Steam API
    if (!steamId) {
        try {
            const urlString = trimmedInput.startsWith('http://') || trimmedInput.startsWith('https://')
                ? trimmedInput
                : `https://${trimmedInput}`
            const url = new URL(urlString)

            if (url.hostname === 'steamcommunity.com' || url.hostname.endsWith('.steamcommunity.com')) {
                const vanityMatch = url.pathname.match(/^\/id\/([^/]+)/)
                if (vanityMatch) {
                    steamId = await resolveVanityUrlToSteamId(vanityMatch[1])
                }
            }
        } catch {
            // невалидный URL — просто игнорируем, пойдём как по никнейму Faceit
        }
    }

    if (steamId) {
        // Пытаемся найти игрока по Steam ID
        playerId = await getPlayerIdBySteamId(steamId)
        if (!playerId) {
            return NextResponse.json(
                { error: 'Игрок с таким Steam ID не найден в Faceit', code: 'PLAYER_NOT_FOUND' },
                { status: 404 }
            )
        }
    } else {
        // Предполагаем, что это никнейм Faceit
        try {
            const response = await axiosInstance.get(
                `${FACEIT_API_BASE}/players?nickname=${encodeURIComponent(trimmedInput)}`,
                {
                    headers: getApiHeaders(),
                }
            )
            playerId = response.data?.player_id || null
        } catch (error: any) {
            if (error.response?.status === 404) {
                return NextResponse.json(
                    { error: 'Игрок с таким никнеймом не найден', code: 'PLAYER_NOT_FOUND' },
                    { status: 404 }
                )
            }
            throw error
        }
    }

    if (!playerId) {
        return NextResponse.json(
            { error: 'Игрок не найден', code: 'PLAYER_NOT_FOUND' },
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
            { error: 'Игрок не найден', code: 'PLAYER_NOT_FOUND' },
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

