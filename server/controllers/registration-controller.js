/* eslint-disable camelcase */
import axios from "axios";
import cookie from "cookie-signature";
import merge from "deepmerge";

import config from "../config.json";
import defaultConfig from "../utils/default-config";
import logInternalError from "../utils/log-internal-error";

const registration = (req, res) => {
  const reqOrg = req.params.organization;
  const validSlug = config.some(org => {
    if (org.slug === reqOrg) {
      // merge default config and custom config
      const conf = merge(defaultConfig, org);
      const { host } = conf;
      let registerUrl = conf.proxy_urls.registration;
      // replacing org_slug param with the slug
      registerUrl = registerUrl.replace("{org_slug}", org.slug);
      const timeout = conf.timeout * 5000;
      const { username } = req.body;
      // send request
      axios({
        method: "post",
        headers: {
          "content-type": "application/json",
        },
        url: `${host}${registerUrl}/`,
        timeout,
        data: req.body,
      })
        .then(response => {
          const authTokenCookie = cookie.sign(
            response.data.key,
            conf.secret_key,
          );
          const usernameCookie = cookie.sign(username, conf.secret_key);
          // forward response
          res
            .status(response.status)
            .type("application/json")
            .cookie(`${conf.slug}_auth_token`, authTokenCookie, {
              maxAge: 1000 * 60 * 60 * 24,
            })
            .cookie(`${conf.slug}_username`, usernameCookie, {
              maxAge: 1000 * 60 * 60 * 24,
            })
            .send(response.data);
        })
        .catch(error => {
          if (error.response && error.response.status === 500) logInternalError(error);
          // forward error
          try {
            res
              .status(error.response.status)
              .type("application/json")
              .send(error.response.data);
          } catch (err) {
            logInternalError(error);
            res
              .status(500)
              .type("application/json")
              .send({
                detail: "Internal server error",
              });
          }
        });
    }
    return org.slug === reqOrg;
  });
  // return 404 for invalid organization slug or org not listed in config
  if (!validSlug) {
    res
      .status(404)
      .type("application/json")
      .send({
        detail: "Not found.",
      });
  }
};

export default registration;
