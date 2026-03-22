import axios from 'axios';
import * as cheerio from 'cheerio';
// @ts-ignore
import { YoutubeTranscript } from 'youtube-transcript';
import logger from '../utils/logger';
import config from '../config';

export const extractArticleContent = async (url: string): Promise<string> => {
    try {
        const parsedUrl = new URL(url);
        // SSRF Protection: Deny localhost/internal references
        if (['localhost', '127.0.0.1', '169.254.169.254'].includes(parsedUrl.hostname) || parsedUrl.hostname.endsWith('.local')) {
            throw new Error('Invalid or unsupported URL domain');
        }

        const response = await axios.get(url, {
            timeout: config.extraction.httpTimeout,
            headers: {
                'User-Agent': config.extraction.userAgent,
                'Accept': 'text/html'
            }
        });

        const html = response.data;
        const $ = cheerio.load(html);

        // Remove typical noisy elements
        $('script, style, nav, footer, iframe, noscript, .ad, .advertisement').remove();

        const title = $('title').text() || $('h1').first().text();
        const bodyText = $('body').text().replace(/\s+/g, ' ').trim();

        if (bodyText.length < 50) {
            throw new Error('Not enough text content found on this page');
        }

        return `Title: ${title}\n\nContent:\n${bodyText}`;
    } catch (error: any) {
        logger.error({ error: error.message, url }, 'Failed to extract article content');
        
        let userFriendlyError = 'We could not read this website. Please check the URL or try pasting the text manually.';
        
        if (error.response) {
            // The request was made and the server responded with a status code outside the 2xx range
            if (error.response.status === 403 || error.response.status === 401) {
                userFriendlyError = 'This website restricts automated access. It might be behind a paywall, require login, or block bots (like DataCamp or Medium). Please copy and paste the text manually instead.';
            } else if (error.response.status === 404) {
                 userFriendlyError = 'This web page could not be found. Please double-check the URL.';
            } else if (error.response.status >= 500) {
                 userFriendlyError = 'The website is currently experiencing issues. Please try again later or paste the text manually.';
            }
        } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
             userFriendlyError = 'The website took too long to respond. It might be down or heavily loaded. Please try again later.';
        } else if (error.message.includes('Not enough text content')) {
             userFriendlyError = 'We scanned this page but could not find enough readable article text. It might be mostly images, a video page, or heavily interactive. Please paste the text manually.';
        } else if (error.message.includes('Invalid or unsupported URL')) {
             userFriendlyError = 'This URL does not appear to be a valid public website.';
        }

        throw new Error(userFriendlyError);
    }
};

export const extractYoutubeTranscript = async (url: string): Promise<string> => {
    try {
        const parsedUrl = new URL(url);
        if (!['youtube.com', 'www.youtube.com', 'youtu.be'].includes(parsedUrl.hostname)) {
            throw new Error('Not a valid YouTube URL');
        }

        const transcriptItems = await YoutubeTranscript.fetchTranscript(url);
        if (!transcriptItems || transcriptItems.length === 0) {
            throw new Error('No transcript available for this video');
        }

        const fullText = transcriptItems.map((item: any) => item.text).join(' ');
        
        return fullText;
    } catch (error: any) {
        logger.error({ error: error.message, url }, 'Failed to extract YouTube transcript');
        
        let userFriendlyError = 'We could not extract the transcript from this YouTube video.';
        
        const errorMessage = error.message?.toLowerCase() || '';

        if (errorMessage.includes('not a valid youtube url')) {
            userFriendlyError = 'This does not look like a standard YouTube video link. Please make sure it is a full video (e.g., youtube.com/watch?v=...).';
        } else if (errorMessage.includes('no transcript available') || errorMessage.includes('transcript is disabled')) {
            userFriendlyError = 'The creator has disabled closed captions for this video, or it does not have a transcript available to read. Please try a different video.';
        } else if (errorMessage.includes('timeout') || error.code === 'ECONNABORTED') {
            userFriendlyError = 'YouTube took too long to respond. Please try again in a moment.';
        }

        throw new Error(userFriendlyError);
    }
};
