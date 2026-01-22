import i18next from 'i18next';
import Backend from 'i18next-fs-backend';
import * as i18nextMiddleware from 'i18next-http-middleware';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

i18next
    .use(Backend)
    .use(i18nextMiddleware.LanguageDetector)
    .init({
        fallbackLng: 'vi',
        supportedLngs: ['vi', 'en'],
        preload: ['vi', 'en'],
        backend: {
            loadPath: path.join(__dirname, 'locales/{{lng}}/{{ns}}.json'),
        },
        detection: {
            order: ['header', 'querystring'],
            caches: false,
        },
        interpolation: {
            escapeValue: false,
        },
    });

export default i18next;
