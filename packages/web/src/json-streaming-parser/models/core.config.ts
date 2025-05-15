export const coreConfig = {
  api: {
    params: {
      noCache: 'noCache',
      dataSourceState: {
        page: 'page',
        pageSize: 'pageSize',
        filter: 'filter',
        sort: {
          fieldsSeparator: ',',
          field: 'field',
          order: 'order'
        }
      }
    }
  },
  pagination: {
    defaultPageSize: 10,
    paginatorMaxSize: 3,
    pageSizeOptions: [10, 20, 30, 40, 50, 100],
    nextPageDebounceTime: 200
  },
  filter: {
    textFilterDebounceTime: 150,
    textFilterLongDebounceTime: 500,
    minFilterLength: 3
  },
  files: {
    fileSizeFormatLabels: [{ label: 'byte', pluralLabel: 'bytes' }, { label: 'KB' }, { label: 'MB' }, { label: 'GB' }]
  },
  forms: {
    autoFocusDelay: 50, // miliseconds
    maskedInput: {
      autoHideDelay: 15, // seconds
      maskSymbol: 'X',
      ignoredSymbols: ['-']
    }
  },
  json: {
    format: {
      space: 4
    }
  },
  loading: {
    maxValue: 100,
    animationDuration: {
      long: 10000
    },
    cutoutPercentage: {
      default: 75
    },
    backgroundColor: {
      default: '#d6d6d6',
      empty: '#000000'
    }
  },
  securityPolicySettings: {
    default: [
      // eslint-disable-next-line  @typescript-eslint/quotes
      `default-src 'self'`,
      // eslint-disable-next-line  @typescript-eslint/quotes
      `img-src 'self' https: data:`,
      // eslint-disable-next-line  @typescript-eslint/quotes
      `style-src 'self' 'unsafe-inline'`,
      // eslint-disable-next-line  @typescript-eslint/quotes
      `script-src 'self' 'unsafe-eval' https://player.vimeo.com/api/player.js`
    ],
    // eslint-disable-next-line  @typescript-eslint/quotes
    sentryWithRss: `connect-src 'self' https://sentry.io/ https://apisecurity.io/feed/index.xml`,
    // eslint-disable-next-line  @typescript-eslint/quotes
    apisecurityio: `connect-src 'self' https://apisecurity.io/feed/index.xml`,
    // eslint-disable-next-line  @typescript-eslint/quotes
    vimeoFrameSrc: `frame-src https://player.vimeo.com/`
  },
  emails: {
    //  valid exemples: https://regex101.com/r/0xXTvA/1
    pattern: '^[\\w\\-+.]+@((\\w\\-?)+\\.){1,4}[a-zA-Z0-9]{2,63}$',
    maxLength: 255
  },
  base64ValidationPattern:
    '^(?:[a-zA-Z0-9+/]{4})*(?:|(?:[a-zA-Z0-9+/]{3}=)|(?:[a-zA-Z0-9+/]{2}==)|(?:[a-zA-Z0-9+/]{1}===))$',
  uuidPattern: new RegExp('^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$|^$', 'ig')
};
