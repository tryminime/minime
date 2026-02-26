// YouTube and media detection utility
export class MediaDetector {
    static detectYouTube(url, title) {
        if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
            return null;
        }

        const videoId = this.extractYouTubeId(url);

        return {
            platform: 'YouTube',
            videoId: videoId,
            videoTitle: title,
            isVideo: true,
        };
    }

    static extractYouTubeId(url) {
        const patterns = [
            /youtube\.com\/watch\?v=([^&]+)/,
            /youtu\.be\/([^?]+)/,
            /youtube\.com\/embed\/([^?]+)/,
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) return match[1];
        }

        return null;
    }

    static detectMedia(url) {
        const mediaDomains = [
            'youtube.com',
            'youtu.be',
            'vimeo.com',
            'netflix.com',
            'disneyplus.com',
            'hulu.com',
            'primevideo.com',
            'twitch.tv',
            'spotify.com',
            'soundcloud.com',
        ];

        const domain = new URL(url).hostname.replace('www.', '');

        for (const mediaDomain of mediaDomains) {
            if (domain.includes(mediaDomain)) {
                return {
                    isMedia: true,
                    platform: this.getPlatformName(mediaDomain),
                };
            }
        }

        return { isMedia: false };
    }

    static getPlatformName(domain) {
        const platformMap = {
            'youtube.com': 'YouTube',
            'youtu.be': 'YouTube',
            'vimeo.com': 'Vimeo',
            'netflix.com': 'Netflix',
            'disneyplus.com': 'Disney+',
            'hulu.com': 'Hulu',
            'primevideo.com': 'Prime Video',
            'twitch.tv': 'Twitch',
            'spotify.com': 'Spotify',
            'soundcloud.com': 'SoundCloud',
        };

        return platformMap[domain] || domain;
    }

    static enrichActivity(activity) {
        const { url, windowTitle } = activity;

        // Check for YouTube
        const youtubeData = this.detectYouTube(url, windowTitle);
        if (youtubeData) {
            return {
                ...activity,
                metadata: {
                    ...youtubeData,
                },
            };
        }

        // Check for other media
        const mediaData = this.detectMedia(url);
        if (mediaData.isMedia) {
            return {
                ...activity,
                metadata: {
                    ...mediaData,
                },
            };
        }

        return activity;
    }
}
