import * as heimdall from './index'
import * as visitParameters from './visitParameters'

const defaultSetttings = heimdall.settings();

describe("module", () => {
  beforeEach(() => {
    // Reset history
    visitParameters.set(heimdall.settings(), []);
    visitParameters.set(defaultSetttings, []);

    // Reset settings

    heimdall.settings(defaultSetttings);
  });

  describe("settings", () => {
    it("it should update trackingSettings when passed options", () => {
        const settings = heimdall.settings({
          test: true
        });

        expect(settings.test).toEqual(true);
    });

    it("it should return trackingSettings when no options are passed", () => {
      const settings = heimdall.settings();

      expect(settings).toBeTruthy()
      expect(settings.localStorageName).toBeTruthy();
    });
  });

  describe("save", () => {
    it("should save referrer if trackReferrer is truthy.", () => {
      heimdall.settings({
        trackReferrer: true
      });

      Object.defineProperty(document, 'referrer', {
        writable: true,
        value: 'https://fake.com'
      });

      heimdall.save();

      const params = heimdall.params();
      expect(params).toBeTruthy();
      expect(params.referrer).toBeTruthy();
      expect(params.referrer).toEqual("https://fake.com");
    });

    it("should not save referrer it trackReferrer is falsey.", () => {
      heimdall.settings({
        trackReferrer: false
      });

      Object.defineProperty(document, 'referrer', {
        writable: true,
        value: 'https://fake.com'
      });

      heimdall.save();

      const params = heimdall.params();
      expect(params).toBeTruthy();
      expect(params.referrer).toBeUndefined();
    });

    it("should ignore visits without UTM params if ignoreVisitsWithoutUTMParameters is truthy.", () => {
      delete window.location
      window.location = {
        search: '?'
      }

      heimdall.settings({
        ignoreVisitsWithoutUTMParameters: true
      });

      heimdall.save();

      const visits = visitParameters.get(heimdall.settings());
      expect(visits).toBeTruthy();
      expect(visits.length).toEqual(0);
    });

    it("should save visits without UTM params if ignoreVisitsWithoutUTMParameters is falsey.", () => {
      delete window.location
      window.location = {
        search: '?'
      }

      heimdall.settings({
        ignoreVisitsWithoutUTMParameters: false
      });

      heimdall.save();

      const visits = visitParameters.get(heimdall.settings());
      expect(visits).toBeTruthy();
      expect(visits.length).toEqual(1);
    });


    it("should save visits with utm params", () => {
      delete window.location
      window.location = {
        search: '?utm_campaign=test'
      }

      heimdall.settings({
        ignoreVisitsWithoutUTMParameters: true
      });

      heimdall.save();

      const visits = visitParameters.get(heimdall.settings());
      expect(visits).toBeTruthy();
      expect(visits.length).toEqual(1);
    });

    it("should not save visits if visitFilterFunction returns falsey.", () => {
      heimdall.settings({
        visitFilterFunction: ({ query, cookies }) => {
          expect(query).toBeTruthy();
          expect(cookies).toBeTruthy();

          return false
        }
      });

      heimdall.save();

      const visits = visitParameters.get(heimdall.settings());
      expect(visits).toBeTruthy();
      expect(visits.length).toEqual(0);
    });

    it("should save visits if visitFilterFunction returns truthy.", () => {
      heimdall.settings({
        visitFilterFunction: ({ query, cookies }) => {
          expect(query).toBeTruthy();
          expect(cookies).toBeTruthy();

          return true
        }
      });

      heimdall.save();

      const visits = visitParameters.get(heimdall.settings());
      expect(visits).toBeTruthy();
      expect(visits.length).toEqual(1);
    });

    it("should respect limitVisits setting.", () => {
      heimdall.settings({
        limitVisits: 3
      })

      heimdall.save();
      heimdall.save();
      heimdall.save();
      heimdall.save();
      heimdall.save();

      const visits = visitParameters.get(heimdall.settings());
      expect(visits).toBeTruthy();
      expect(visits.length).toEqual(3);
    });
  });
});
