import Nango from '@nangohq/frontend';

const nango = new Nango({ connectSessionToken: process.env.NANGO_CONNECT_SESSION_TOKEN });

export default nango;