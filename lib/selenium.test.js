const { Builder, By, Key, until } = require('selenium-webdriver');
const assert = require('assert');
const fs = require('fs'); // Zum Lesen der Datei
const path = require('path');
const { spawn } = require('child_process');
const chrome = require('selenium-webdriver/chrome');
const logging = require('selenium-webdriver/lib/logging');


// Logierungs-Einstellungen für Chrome aktivieren
const prefs = new logging.Preferences();
prefs.setLevel(logging.Type.BROWSER, logging.Level.ALL); // Erfasst ALLE Browser-Logs

// Funktion zum Abrufen von Cookies
async function getCookieValue(driver, cookieName) {
    const cookies = await driver.manage().getCookies();
    const cookie = cookies.find((cookie) => cookie.name === cookieName);
    return cookie ? cookie.value : null;
}

async function setCookieValue(driver, cname, cvalue, exmin = 1) {
    let cookie = cname + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/";
    var d = new Date();
    d.setTime(d.getTime() + (exmin * 24 * 60 * 60 * 1000));
    var expires = "expires=" + d.toUTCString();
    cookie = cname + "=" + cvalue + ";" + expires + ";path=/;SameSite=None;Secure";

    await driver.manage().addCookie(cookie);
    console.log(`Cookie gespeichert: ${cname} = ${cvalue}`);
}

describe('Netzwerkerkennung Selenium Tests', () => {
    let driver;
    let server;

    beforeAll(async () => {
        // Starte den lokalen Server
        server = spawn('node', ['server.js'], { stdio: 'inherit' });

        // Warte kurz, damit der Server starten kann
        await new Promise((resolve) => setTimeout(resolve, 3000));

        driver = await new Builder()
            .forBrowser('chrome')
            .setChromeOptions(new chrome.Options()) // ggf. auch headless: false hinzufügen
            .setLoggingPrefs(prefs) // Logs konfigurieren
            .build();

    }, 30000);

    afterAll(async () => {
        // await driver.quit();
        // Stoppe den Server
        // server.kill();
    });

    const baseUrl = 'http://localhost:3000?magaDebug=true';
    const plainBaseUrl = 'http://localhost:3000';
    describe('URL Param', () => {
        it.each([
            ['bid', 'ADCELL', 30],
            ['adcell_id', 'ADCELL', 30],
            ['belboon', 'Belboon', 30],
            ['awc', 'AWIN', 30],
            ['wgu', 'Webgains', 30],
            ['gclid', 'Google', 1],
            ['msclkid', 'Bing', 1],
            ['li_fat_id', 'LinkedIn', 30],
            ['fbclid', 'META', 30],
            ['twclid', 'Twitter', 30],
            ['billiger', 'Billiger', 30],
            ['ref', 'GoAffPro', 30],
        ])(
            '?%s= -> %s with expiry %i days',
            async (param, expectedNetworkName, expectedExpiry) => {
                // URL mit Parametern besuchen
                await driver.get(`${baseUrl}&${param}=testValue`);
                await driver.wait(until.urlContains(param), 5000);

                // Cookie überprüfen
                let cookie = await getCookieValue(driver, 'atux_trk');
                cookie = JSON.parse(cookie);
                console.log('Cookie-Wert: ', cookie['network']);
                assert.strictEqual(cookie['network'], expectedNetworkName);
                // trackingMethod aus der index.js - 3 = URL Parameter
                assert.strictEqual(cookie['method'], 3);
            }
        );

        it('should not recognize any network if no relevant URL parameter is provided', async () => {
            // URL ohne Netzwerke-Parameter besuchen
            await driver.manage().deleteAllCookies();
            await driver.get(`${baseUrl}&someOtherParam=12345`);
            await driver.wait(until.urlContains('someOtherParam'), 5000);

            // Sicherstellen, dass kein Netzwerk-Cookie gesetzt wurde
            const cookieValue = await getCookieValue(driver, 'atux');
            console.log('Cookie-Wert: ', cookieValue);
            assert.strictEqual(cookieValue, null);
        });
    });

    describe('UTM Param', () => {
        it.each([
            ['email', 'E-Mail', 30],
            ['klaviyo', 'Klaviyo', 30],
            ['brevo', 'Brevo', 30],
            ['biliger.de', 'Billiger.de', 30],
            ['billiger.de', 'Billiger', 30],
        ])(
            '&utm_source=%s -> %s and expiry %i days',
            async (param, expectedNetworkName, expectedExpiry) => {
                // URL mit Parametern besuchen
                await driver.manage().deleteAllCookies();
                await driver.get(`${baseUrl}&utm_source=${param}`);
                await driver.wait(until.urlContains(param), 5000);
                const browserLogs = await driver.manage().logs().get(logging.Type.BROWSER);
                browserLogs.forEach(log => {
                    console.log(`[${log.level.name}] ${log.message}`);
                });

                // Cookie überprüfen
                let cookie = await getCookieValue(driver, 'atux_trk');
                cookie = JSON.parse(cookie);
                console.log('Cookie-Wert: ', cookie['network']);
                assert.strictEqual(cookie['network'], expectedNetworkName);
                // trackingMethod aus der index.js - 5 = UTM-Source
                assert.strictEqual(cookie['method'], 5);
            }
        );

        it('should not recognize any network if no relevant URL parameter is provided', async () => {
            // URL ohne Netzwerke-Parameter besuchen
            await driver.manage().deleteAllCookies();
            await driver.get(`${baseUrl}&utm_source=12345`);
            await driver.wait(until.urlContains('utm_source'), 5000);

            // Sicherstellen, dass kein Netzwerk-Cookie gesetzt wurde
            const cookieValue = await getCookieValue(driver, 'atux');
            console.log('Cookie-Wert: ', cookieValue);
            assert.strictEqual(cookieValue, null);
        });
    });

    describe('Cookies', () => {
        it.each([
            ['AWSESS', 'AWIN', 30],
            ['aw', 'AWIN', 30],
            ['awpv', 'AWIN', 30],
            ['aw3', 'AWIN', 30],
            ['awc', 'AWIN', 30],
            ['adcell', 'ADCELL', 30],
            ['adcell_id', 'ADCELL', 30],
            ['adcell_token', 'ADCELL', 30],
            ['adcell_merchant', 'ADCELL', 30],
            ['__CK__WG__', 'Webgains', 30],
            ['wgcampaignid', 'Webgains', 30],
            ['wguserid', 'Webgains', 30],
            ['_gcl_gb', 'Google', 1],
            ['_gcl_aw', 'Google', 1],
            ['_gcl_gs', 'Google', 1],
            ['_gcl_ag', 'Google', 1],
            ['_opt_awkid', 'Google', 1],
            ['__gads', 'Google', 1],
            ['__gpi', 'Google', 1],
            ['_uetsid', 'Bing', 1],
            ['_uetvid', 'Bing', 1],
            ['_uetmsclkid', 'Bing', 1]
        ])(
            '%s Cookie -> %s and expiry %i days',
            async (param, expectedNetworkName, expectedExpiry) => {
                // URL mit Parametern besuchen
                await driver.get(`${baseUrl}`);
                await driver.manage().deleteAllCookies();
                await driver.executeScript(`
                    document.cookie = "${param}=TestNetwork;path=/;max-age=${30 * 24 * 60 * 60}";
                `);
                // await setCookieValue(driver, param, 'testValue', expectedExpiry);
                await driver.sleep(300);
                await driver.get(`${baseUrl}&XXX${param}=testValue`);
                await driver.wait(until.urlContains(param), 5000);

                // Cookie überprüfen
                let cookie = await getCookieValue(driver, 'atux_trk');
                cookie = JSON.parse(cookie);
                console.log('Cookie-Wert: ', cookie['network']);
                assert.strictEqual(cookie['network'], expectedNetworkName);
                // trackingMethod aus der index.js - 4 = Cookie
                assert.strictEqual(cookie['method'], 4);
            }
        );

        it('should not recognize any network if no relevant URL parameter is provided', async () => {
            // URL ohne Netzwerke-Parameter besuchen
            await driver.manage().deleteAllCookies();
            await driver.get(`${baseUrl}&someOtherParam=12345`);
            await driver.wait(until.urlContains('someOtherParam'), 5000);

            // Sicherstellen, dass kein Netzwerk-Cookie gesetzt wurde
            const cookieValue = await getCookieValue(driver, 'atux');
            console.log('Cookie-Wert: ', cookieValue);
            assert.strictEqual(cookieValue, null);
        });
    });

    describe('Referrer', () => {
        it.each([
            ['https://duckduckgo.com/asdasda', 'duckduckgo', 30],
            ['https://duckduckgo.com', 'duckduckgo', 30],
            ['https://search.yahoo.com', 'Yahoo Search', 30],
            ['https://www.google.com', 'Google Search', 1],
            ['https://www.google.com/s/searcheetwas', 'Google Search', 1],
            ['https://www.bing.com', 'Bing Search', 1],
            ['https://www.bing.com/sadasdasd', 'Bing Search', 1],
            ['https://m.facebook.com/', 'META', 1],
            ['https://idealo.de/product-1', 'IDEALO', 1],
            ['https://www.guenstiger.de/anderes-1234', 'Guenstiger_de', 1],
        ])(
            'Ref: %s -> %s and expiry %i days',
            async (param, expectedNetworkName, expectedExpiry) => {
                // URL mit Parametern besuchen
                await driver.manage().deleteAllCookies();
                // Zwischenseite für Redirect als Referrer nutzen
                await driver.get(`${baseUrl}&default=testValue`);
                await driver.executeScript(`
                    Object.defineProperty(document, 'referrer', { get: () => '${param}' });
                    heimdall.setNetwork();
                `);
                await driver.get(`${baseUrl}&ref___${param}=testValue`);
                await driver.wait(until.urlContains(param), 5000);

                // Cookie überprüfen
                let cookie = await getCookieValue(driver, 'atux_trk');
                cookie = JSON.parse(cookie);
                console.log('Cookie-Wert: ', cookie);
                assert.strictEqual(cookie['network'], expectedNetworkName);
                // trackingMethod aus der index.js - 7 = Referrer
                assert.strictEqual(cookie['method'], 7);
            }
        );

        it.each([
            ['https://www.guenstiger.at/at_und_nicht_de', 'null', 1]
        ])(
            'Ref: %s -> NULL',
            async (param, expectedNetworkName, expectedExpiry) => {
                // URL mit Parametern besuchen
                await driver.manage().deleteAllCookies();
                // Zwischenseite für Redirect als Referrer nutzen
                await driver.get(`${baseUrl}&default=testValue`);
                await driver.executeScript(`
                    Object.defineProperty(document, 'referrer', { get: () => '${param}' });
                    heimdall.setNetwork();
                `);
                await driver.get(`${baseUrl}&ref___${param}=testValue`);
                await driver.wait(until.urlContains(param), 5000);

                // Cookie überprüfen
                let cookie = await getCookieValue(driver, 'atux_trk');
                cookie = JSON.parse(cookie);
                console.log('Cookie-Wert: ', cookie);
                assert.strictEqual(cookie, null);
            }
        );

        it('should not recognize any network if no relevant URL parameter is provided', async () => {
            // URL ohne Netzwerke-Parameter besuchen
            await driver.manage().deleteAllCookies();
            await driver.get(`${baseUrl}&someOtherParam=12345`);
            await driver.wait(until.urlContains('someOtherParam'), 5000);

            // Sicherstellen, dass kein Netzwerk-Cookie gesetzt wurde
            const cookieValue = await getCookieValue(driver, 'atux');
            console.log('Cookie-Wert: ', cookieValue);
            assert.strictEqual(cookieValue, null);
        });
    });

    describe('Edge Cases', () => {
        it('Real-Case: Facebook/META Klick JTL 5', async () => {
            // URL mit Parametern besuchen
            await driver.manage().deleteAllCookies();
            await driver.get(`${baseUrl}&qs=evo+hd+touch+7%3Futm_source%3Dfacebook_sale_vid3&utm_medium=paid&utm_source=ig&utm_id=120216342782020228&utm_content=120216599276240228&utm_term=120216599276250228&utm_campaign=120216342782020228&fbclid=PAZXh0bgNhZW0BMABhZGlkAasYXeG1mbQBpj2a6LgzTcSy0TnAGPV1XljORob2CpY4_NKQF95kKVcCULeWT9WTVMzFWg_aem_xBeviKSJF3pGfApZBVTg5A`);
            await driver.wait(until.urlContains('3Dfacebook_sale_vid3'), 5000);

            // Cookie überprüfen
            let cookie = await getCookieValue(driver, 'atux_trk');
            cookie = JSON.parse(cookie);
            console.log('Cookie-Wert: ', cookie);
            assert.strictEqual(cookie['network'], 'META');
            // trackingMethod aus der index.js - 3 = URL Param
            assert.strictEqual(cookie['method'], 3);
        });

        it('Affiliate Cookie vorhanden -> Google direkt click', async () => {
            // URL mit Parametern besuchen
            await driver.manage().deleteAllCookies();
            await driver.get(`${baseUrl}&belboon=1234567890`);
            await driver.wait(until.urlContains('belboon'), 5000);

            // Cookie überprüfen
            let cookie = await getCookieValue(driver, 'atux_trk');
            cookie = JSON.parse(cookie);
            console.log('Cookie-Wert: ', cookie);
            assert.strictEqual(cookie['network'], 'Belboon');
            // trackingMethod aus der index.js - 3 = URL Param
            assert.strictEqual(cookie['method'], 3);

            await driver.get(`${baseUrl}&gclid=1234567890`);
            await driver.wait(until.urlContains('gclid'), 5000);

            // Cookie überprüfen
            cookie = await getCookieValue(driver, 'atux_trk');
            cookie = JSON.parse(cookie);
            console.log('Cookie-Wert: ', cookie);
            assert.strictEqual(cookie['network'], 'Google');
            // trackingMethod aus der index.js - 3 = URL Param
            assert.strictEqual(cookie['method'], 3);
        });

        it('Affiliate + Bing Cookie vorhanden -> Google direkt click', async () => {
            // URL mit Parametern besuchen
            await driver.get(`${baseUrl}`);
            await driver.manage().deleteAllCookies();
            await driver.executeScript(`
                    document.cookie = "awc=AWINCookie;path=/;max-age=${30 * 24 * 60 * 60}";
                    document.cookie = "_uetsid=BingCookie;path=/;max-age=${30 * 24 * 60 * 60}";
                `);
            // await setCookieValue(driver, param, 'testValue', expectedExpiry);
            await driver.sleep(300);
            await driver.get(`${baseUrl}&gclid=1234567890`);
            await driver.wait(until.urlContains('gclid'), 5000);

            // Cookie überprüfen
            let cookie = await getCookieValue(driver, 'atux_trk');
            cookie = JSON.parse(cookie);
            console.log('Cookie-Wert: ', cookie);
            assert.strictEqual(cookie['network'], 'Google');
            // trackingMethod aus der index.js - 3 = URL Param
            assert.strictEqual(cookie['method'], 3);
        });

        it('Affiliate + Bing + META Cookie vorhanden -> Prio Affiliate', async () => {
            // URL mit Parametern besuchen
            await driver.get(`${baseUrl}`);
            await driver.manage().deleteAllCookies();
            await driver.executeScript(`
                    document.cookie = "awc=AWINCookie;path=/;max-age=${30 * 24 * 60 * 60}";
                    document.cookie = "_uetsid=BingCookie;path=/;max-age=${30 * 24 * 60 * 60}";
                    document.cookie = "_fbc=METACookie;path=/;max-age=${30 * 24 * 60 * 60}";
                `);
            // await setCookieValue(driver, param, 'testValue', expectedExpiry);
            await driver.sleep(300);
            await driver.get(`${baseUrl}&randomParam=1234567890`);
            await driver.wait(until.urlContains('randomParam'), 5000);

            // Cookie überprüfen
            let cookie = await getCookieValue(driver, 'atux_trk');
            cookie = JSON.parse(cookie);
            console.log('Cookie-Wert: ', cookie);
            assert.strictEqual(cookie['network'], 'AWIN');
            // trackingMethod aus der index.js - 3 = Cookie
            assert.strictEqual(cookie['method'], 4);
        });

        it('Bing + META Cookie vorhanden -> Wer gewinnt?', async () => {
            // URL mit Parametern besuchen
            await driver.get(`${baseUrl}`);
            await driver.manage().deleteAllCookies();
            await driver.executeScript(`
                    document.cookie = "_uetsid=BingCookie;path=/;max-age=${30 * 24 * 60 * 60}";
                    document.cookie = "_fbc=METACookie;path=/;max-age=${30 * 24 * 60 * 60}";
                `);
            // await setCookieValue(driver, param, 'testValue', expectedExpiry);
            await driver.sleep(300);
            await driver.get(`${baseUrl}&randomParam=1234567890`);
            await driver.wait(until.urlContains('randomParam'), 5000);

            // Cookie überprüfen
            let cookie = await getCookieValue(driver, 'atux_trk');
            cookie = JSON.parse(cookie);
            console.log('Cookie-Wert: ', cookie);
            assert.strictEqual(cookie['network'], 'Bing');
            // trackingMethod aus der index.js - 3 = Cookie
            assert.strictEqual(cookie['method'], 4);
        });
    });
});
