import http from 'k6/http';
import {check, sleep} from 'k6';

export default function() {
    let res = http.get(`http://${__ENV.HTTP_HOST}/${__ENV.API_VERSION}/loader.js`);
    check(res, { 'success': (r) => r.status === 200 });
    sleep(0.3);
}
