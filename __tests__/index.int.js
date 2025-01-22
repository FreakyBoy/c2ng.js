import * as heimdall from '../lib';
import * as visitParameters from '../lib/visitParameters';

const defaultSetttings = heimdall.settings({
  ignoreVisitsWithoutUTMParameters: false
});

describe("module", () => {
  beforeEach(() => {
    // Reset history
    visitParameters.set(heimdall.settings(), []);
    visitParameters.set(defaultSetttings, []);

    // Reset settings

    heimdall.settings(defaultSetttings);
  });

  describe("params", () => {
    it("it should create a new param object if it doesn't exist yet.", () => {
      const paramObject = heimdall.params();

      expect(paramObject).toBeTruthy();
    });

    it("it should return the current param object.", () => {
      const paramObject = heimdall.save()

      expect(heimdall.params()).toEqual(paramObject);
    });
  });

  describe("save", () => {
    it("it should create and save a param object into storage.", () => {
      const paramObject = heimdall.save();
      const visits = visitParameters.get(heimdall.settings());

      expect(visits).toBeTruthy();
      expect(paramObject).toBeTruthy();
      expect(visits.length).toEqual(1);
    });

    it("it should only save a new param objects if called multiple times.", () => {
      heimdall.save();
      heimdall.save();

      const visits = visitParameters.get(heimdall.settings());

      expect(visits).toBeTruthy();
      expect(visits.length).toEqual(2);
    });

    it("save current page in param object correctly.", () => {
      delete window.location
      window.location = {
        search: '?',
        href: 'localhost/'
      }

      const paramObject = heimdall.save();

      expect(paramObject).toBeTruthy();
      expect(paramObject.page).toBeTruthy();
      expect(paramObject.page).toEqual(window.location.href);
    });

    it("saves query parameters in param object correctly.", () => {
      const params = { utm_campaign: 'test', utm_source: 'source' };

      delete window.location
      window.location = {
        search: '?' + Object.keys(params).map(key => `${key}=${params[key]}`).join('&')
      }

      const paramObject = heimdall.save();

      expect(paramObject).toBeTruthy();
      expect(paramObject.query).toBeTruthy();
      expect(paramObject.query).toEqual(params);
    });

    it("saves cookies in param object correctly.", () => {
      document.cookie = "_fbc=test-hello;"

      const paramObject = heimdall.save();

      expect(paramObject).toBeTruthy();
      expect(paramObject.cookies).toBeTruthy();
      expect(paramObject.cookies._fbc).toEqual('test-hello;');
    });

    it("saves time in param object.", () => {
      const paramObject = heimdall.save();

      expect(paramObject).toBeTruthy();
      expect(paramObject.time).toBeTruthy();
      const timeObject = new Date(paramObject.time);
      expect(!isNaN(timeObject.getTime())).toBeTruthy();
    });
  });

  describe("firstClickParams", () => {
    it("should return first visit params.", () => {
      const paramObject = heimdall.save();
      heimdall.save();
      heimdall.save();

      expect(heimdall.firstClickParams()).toEqual(paramObject);
    });
  });

  describe("historicalParams", () => {
    it("should return all visits.", () => {
      const visits = [
        heimdall.save(),
        heimdall.save(),
        heimdall.save()
      ]

      expect(heimdall.historicalParams()).toEqual(visits);
    })
  });
});
