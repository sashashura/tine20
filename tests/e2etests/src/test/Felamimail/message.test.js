const expect = require('expect-puppeteer');
const lib = require('../../lib/browser');
require('dotenv').config();

beforeAll(async () => {
    await lib.getBrowser('E-Mail');
    await page.waitForSelector('div.x-tree-selected a span',{text: "Posteingang"});
});

describe('message', () => {
    let popupWindow;
    test('compose message with uploaded attachment', async () => {
        popupWindow = await lib.getEditDialog('Verfassen');
        let currentUser = await lib.getCurrentUser(popupWindow);
        // add recipient
        let inputFields = await popupWindow.$$('input');
        await inputFields[2].type(currentUser.accountEmailAddress);
        await popupWindow.waitForSelector('.search-item.x-combo-selected');
        await popupWindow.click('.search-item.x-combo-selected');
        await popupWindow.waitForTimeout(500); //wait for new mail line!
        await popupWindow.click('input[name=subject]');
        await popupWindow.waitForTimeout(500); //musst wait for input!
        await expect(popupWindow).toFill('input[name=subject]', 'message with attachment');

        const fileToUpload = 'src/test/Felamimail/attachment.txt';
        await expect(popupWindow).toClick('.x-btn-text', {text: 'Datei hinzufügen'});
        const filePickerWindow = await lib.getNewWindow();
        await expect(filePickerWindow).toClick('span',{text: 'Mein Gerät'});
        await filePickerWindow.waitForSelector('input[type=file]');
        const inputUploadHandle = await filePickerWindow.$('input[type=file]');
        await inputUploadHandle.uploadFile(fileToUpload);

        await expect(popupWindow).toMatchElement('.x-grid3-cell-inner.x-grid3-col-name', {text:'attachment.txt'});
        await popupWindow.waitForTimeout(500); //musst wait for upload complete!
        
        // send message
        await expect(popupWindow).toClick('button', {text: 'Senden'});
    });

    // test('compose message with filemanager attachment', async () => {
    //     await expect(page).toClick('span', {text: process.env.TEST_BRANDING_TITLE});
    //     await expect(page).toClick('.x-menu-item-text', {text: 'Dateimanager'});
    //    
    //     // @TODO
    // });
    
    let newMail;
    test('fetch messages', async () => {
        await page.waitForTimeout(2000); //wait to close editDialog
        await page.click('.t-app-felamimail .x-btn-image.x-tbar-loading');
        try{
          await page.waitForSelector('.flag_unread',{timeout: 10000});
        } catch(e){
          await page.click('.t-app-felamimail .x-btn-image.x-tbar-loading');
          await page.waitForSelector('.flag_unread',{timeout: 10000});
        }
        newMail = await expect(page).toMatchElement('.x-grid3-cell-inner.x-grid3-col-subject', {text: 'message with attachment'});
        await newMail.click();
    });

    test('details panel', async () => {
        await page.waitForSelector('.preview-panel-felamimail');
    });

    test('contextMenu', async () => {
        await newMail.click({button: 'right'});
        await page.screenshot({path: 'screenshots/EMail/17_email_kontextmenu_email.png'});
        await page.keyboard.press('Escape')
    })

    let attachement;
    test.skip('download attachments', async () => {
        newMail.click({clickCount: 2});
        popupWindow = await lib.getNewWindow();
        //await popupWindow.waitForSelector('.ext-el-mask');
        await popupWindow.waitForFunction(() => !document.querySelector('.ext-el-mask'));
        await popupWindow.waitForSelector('.tinebase-download-link');
        attachement = await popupWindow.$$('.tinebase-download-link');
        await attachement[1].hover();
        await attachement[1].click('tinebase-download-link-wait');

        let file = await lib.download(popupWindow, '.x-menu-item-text', {text:'Herunterladen'});

        if(!file.includes('attachment')) {
            throw new Error('download of attachments failed!');
        }
    });

    test.skip('file attachment', async () => {
        await popupWindow.waitForSelector('.tinebase-download-link');
        attachement = await popupWindow.$$('.tinebase-download-link');
        await attachement[1].hover();
        await attachement[1].click('tinebase-download-link-wait');
        await expect(popupWindow).toClick('.x-menu-item-text',
            {text: new RegExp('Datei.*'), visible: true});
        await popupWindow.waitForSelector('.x-grid3-row.x-grid3-row-first');
        await popupWindow.click('.x-grid3-row.x-grid3-row-first');
        await expect(popupWindow).toClick('button', {text: 'Ok'});
        await popupWindow.close();
    });

    test.skip('attachment file in filemanager', async () => {
        await expect(page).toClick('span', {text: process.env.TEST_BRANDING_TITLE});
        await expect(page).toClick('.x-menu-item-text', {text: 'Dateimanager'});
        await page.waitForSelector('.x-grid3-cell-inner.x-grid3-col-name', {text: 'Persönliche Dateien von ' + process.env.TEST_USER});
        await expect(page).toClick('.x-grid3-cell-inner.x-grid3-col-name', {text: 'Persönliche Dateien von ' + process.env.TEST_USER, clickCount: 2});
        await page.waitForSelector('.x-grid3-cell-inner.x-grid3-col-name', {text: 'attachment.txt'});
    });
});

describe.skip('email note preference', () => {
    test('open Felamimail settings and set note=yes', async () => {
        await expect(page).toClick('span', {text: process.env.TEST_BRANDING_TITLE});
        await expect(page).toClick('.x-menu-item-text', {text: 'E-Mail'});
        await page.waitForTimeout(2000);
        await lib.setPreference(page,'E-Mail', 'autoAttachNote', 'ja');
    });
    test('open compose dialog and check button pressed', async () => {
        await page.waitForTimeout(3000);
        let popupWindow = await lib.getEditDialog('Verfassen');
        await popupWindow.waitForSelector('.x-btn.x-btn-text-icon.x-btn-pressed');
        await popupWindow.close();
    });
    test.skip('open Felamimail settings and set note=no', async () => {
        await page.waitForTimeout(2000);
        await lib.setPreference(page,'E-Mail', 'autoAttachNote', 'nein');
    });
    test.skip('open editDialog and check button unpressed', async () => {
        await page.waitForTimeout(2000);
        let popupWindow = await lib.getEditDialog('Verfassen');
        if (await popupWindow.$('.x-btn.x-btn-text-icon.x-btn-pressed') !== null) return Promise.reject('Error: The button is pressed');
        await popupWindow.close();
    });
});

afterAll(async () => {
    browser.close();
});
