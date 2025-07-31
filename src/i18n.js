import ar from './lang/ar.js';
import bn from './lang/bn.js';
import cs from './lang/cs.js';
import da from './lang/da.js';
import de from './lang/de.js';
import el from './lang/el.js';
import en from './lang/en.js';
import eo from './lang/eo.js';
import es from './lang/es.js';
import et from './lang/et.js';
import fi from './lang/fi.js';
import fil from './lang/fil.js';
import fr from './lang/fr.js';
import he from './lang/he.js';
import hi from './lang/hi.js';
import hr from './lang/hr.js';
import hu from './lang/hu.js';
import id from './lang/id.js';
import it from './lang/it.js';
import is from './lang/is.js';
import ja from './lang/ja.js';
import ka from './lang/ka.js';
import ko from './lang/ko.js';
import lt from './lang/lt.js';
import mk from './lang/mk.js';
import nb from './lang/nb.js';
import nl from './lang/nl.js';
import pa_guru from './lang/pa_guru.js';
import pa_arab from './lang/pa_arab.js';
import pl from './lang/pl.js';
import pt from './lang/pt.js';
import pt_br from './lang/pt_br.js';
import sk from './lang/sk.js';
import sl from './lang/sl.js';
import ro from './lang/ro.js';
import ru from './lang/ru.js';
import sr from './lang/sr.js';
import tr from './lang/tr.js';
import uk from './lang/uk.js';
import ur from './lang/ur.js';
import uz from './lang/uz.js';
import zh from './lang/zh.js';
import zh_cn from './lang/zh_cn.js';

export class Translator {
    dict = {
        ar,
        bn,
        cs,
        da,
        de,
        el,
        en,
        eo,
        es,
        et,
        fi,
        fil,
        fr,
        he,
        hi,
        hr,
        hu,
        id,
        it,
        is,
        ja,
        ka,
        ko,
        lt,
        mk,
        nb,
        nl,
        pa_guru,
        pa_arab,
        pl,
        pt,
        pt_br,
        sk,
        sl,
        ro,
        ru,
        sr,
        tr,
        uk,
        ur,
        uz,
        zh,
        zh_cn,
    };

    constructor() {
        //> Reads the language saved in localStorage or uses 'en' by default
        const lang = localStorage.getItem('lang');
        this.defaultLang = 'en';
        this.currentLang = lang || this.defaultLang;
    }

    /**
     * @param {string} key
     * @returns {string}
     */
    t(key) {
        const entryCurrent = this.dict[this.currentLang]?.[key];
        if (entryCurrent) return entryCurrent;

        const entryDefault = this.dict[this.defaultLang]?.[key];
        if (entryDefault) return entryDefault;

        return key;
    }

    getFontByLanguage() {
        const lang = localStorage.getItem('lang');
        let font = 'noto_sans_regular';

        switch (lang) {
            case 'ar':
            case 'bn':
            case 'ka':
            case 'he':
            case 'ja':
            case 'ko':
            case 'pa_arab':
            case 'pa_guru':
            case 'ur':
            case 'zh':
            case 'zh_cn':
                font = `noto_sans_${lang}`;
                break;
        }

        return `/assets/fonts/${font}.json`;
    }
}

export const i18n = new Translator();
