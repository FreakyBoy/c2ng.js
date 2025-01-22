import cookieParameters from './cookieParameters';

const TRACK_COOKIES = ['test', 'other-param', 'hello']; // Extracted constants

// Utility function to set cookies
function setTestCookie(value) {
  document.cookie = value;
}

describe("cookieParameters function", () => {
  it("should return an empty object when no cookies are present", () => {
    setTestCookie(""); // Reuse helper function
    expect(cookieParameters({ trackCookies: [TRACK_COOKIES[0]] })).toEqual({});
  });

  it("should return an empty object when no matching tracked cookies are found", () => {
    setTestCookie("test=hello;");
    expect(cookieParameters({ trackCookies: [TRACK_COOKIES[1], TRACK_COOKIES[2]] })).toEqual({});
  });

  it("should return the values of cookies listed in trackCookies", () => {
    setTestCookie("test=hello; okay=value;");
    expect(cookieParameters({ trackCookies: [TRACK_COOKIES[0], TRACK_COOKIES[1]] })).toEqual({
      test: 'hello',
    });
  });
});
