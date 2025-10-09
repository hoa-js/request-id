## @hoajs/request-id

Request ID middleware for Hoa.

## Installation

```bash
$ npm i @hoajs/request-id --save
```

## Quick Start

```js
import { Hoa } from 'hoa'
import { requestId } from '@hoajs/request-id'

const app = new Hoa()
app.use(requestId())

app.use(async (ctx) => {
  ctx.res.body = `Hello, ${ctx.state.requestId}!`
})

export default app
```

## Documentation

The documentation is available on [hoa-js.com](https://hoa-js.com/middleware/request-id.html)

## Test (100% coverage)

```sh
$ npm test
```

## License

MIT
