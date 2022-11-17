// const Koa = require("koa");
const traceConfig = require('./traceConfig')

const registerFn = require('./registerProvider')

registerFn(traceConfig)

// console.log()

const express = require("express")

const axios = require('axios');

const opentelemetry = require("@opentelemetry/api");

const logging = require('pino-http')({
  serializers: {
      req(req) {
          return {};
      },
      res(res) {
          return {};
      }
  }
})



// const tracer = genTracer(traceConfig)


const {
  serverPort,
  payServerIp,
  payServerPort,
  service
} = traceConfig

const { context, trace } = opentelemetry

const tracer = trace.getTracer(service);

// const app = new Koa();
const app = express();

app.use(logging)

// app.use(async (ctx, _next) => {
//   if (ctx.path === '/setorder') {
//     // console.log('span:%s', context.active().getValue())
//     // const span = trace.getSpan(context.active())
    
//     const span = tracer.startSpan('manual-span-in-order-service');
//     // span.setAttribute('time', new Date().getTime());
//     // span.setAttribute('amount', 100);
//     // span.setAttribute('method', 'alipay');

//     span.end();
//     // span.addEvent('invoking pay work');
//     // await axios.get(`http://${payServerIp}:${payServerPort}/pay`)
//     ctx.body = {
//       status: 'ok'
//     }

//     span.end();
//   }
// });

app.get("/setorder", function (_req, res, _next) {
  const span = tracer.startSpan('manual-span-in-order-serivce');

  span.setAttribute('time', new Date().getTime());
  span.setAttribute('amount', 100);
  span.setAttribute('method', 'alipay');
  res.send({
    status: 'ok'
  });
  span.end();
  // span.end()
  // axios.get(`http://${payServerIp}:${payServerPort}/pay`)
  //   .then(_response => {
  //     console.log('response from order')
  //     res.send({
  //       status: 'ok'
  //     });
  //     span.end();
  //   })
});

app.listen(serverPort, function () {
  console.log(`order app now running on port ${serverPort}`);
});

// http.createServer(async function (request, response) {
//   const span = tracer.startSpan('order-service-custom-span');
//   span.setAttribute('time', new Date().getTime());
//   span.setAttribute('goods', 'pencil');
//   span.setAttribute('number', 2);
//   if (request.url === "/setorder") {
//     console.log('请求进入order')
//     const res = await axios.get(`http://${payServerIp}:${payServerPort}/pay`)
//     // console.log('response from pay service', res)

//     response.writeHead(200, {'Content-Type': 'application/plain'});
//     response.end("response from order");
//     span.end()
//   }
// }).listen(serverPort);
