global.window = {
    location: {
        href: "http://localhost",
        search: '',
        pathname: '/testing/this/path',
    },
    localStorage: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
    },
};

global.magaDomain = 'm-a-g-a.de'

global.document = {
    cookie: '',
    getElementById: jest.fn(), // Mock weitere Methoden bei Bedarf
    referrer: 'https://duckduckgo.com/asdasda',
};
