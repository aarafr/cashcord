import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { v4 as uuidv4 } from "uuid";
import { parseXbrlFile } from "xbrl-parser";

const getReferences = async (legalEntityId: string) => {
  const config: AxiosRequestConfig = {
    method: "get",
    headers: {
      "X-Request-Id": uuidv4(),
      "NBB-CBSO-Subscription-Key": process.env.API_KEY,
      Accept: "application/json",
    },
  };
  return await axios
    .get(`https://ws.cbso.nbb.be/authentic/legalEntity/${legalEntityId}/references`, config)
    .then((response) => {
      const data = response.data;
      let references: string[] = [];
      for (let i: number = 0; i < data.length; i++) {
        references.push(data[i].ReferenceNumber);
      }
      return references.sort().reverse();
    })
    .catch((e) => e.response.status);
};

const getReference = async (referenceNumber: string) => {
  const config: AxiosRequestConfig = {
    method: "get",
    headers: {
      "X-Request-Id": uuidv4(),
      "NBB-CBSO-Subscription-Key": process.env.API_KEY,
      Accept: "application/json",
    },
  };
  return await axios
    .get(`https://ws.cbso.nbb.be/authentic/deposit/${referenceNumber}/reference`, config)
    .then((response) => response.data)
    .catch((e) => e.response.status);
};

const getAccountingDataPdf = async (referenceNumber: string) => {
  const config: AxiosRequestConfig = {
    method: "get",
    headers: {
      "X-Request-Id": uuidv4(),
      "NBB-CBSO-Subscription-Key": process.env.API_KEY,
      Accept: "application/pdf",
    },
    responseType: "arraybuffer",
  };
  return await axios
    .get(`https://ws.cbso.nbb.be/authentic//deposit/${referenceNumber}/accountingData`, config)
    .then((response) => response.data)
    .catch((e) => e.response.status);
};

const getAccountingData = async (referenceNumber: string) => {
  const config: AxiosRequestConfig = {
    method: "get",
    headers: {
      "X-Request-Id": uuidv4(),
      "NBB-CBSO-Subscription-Key": process.env.API_KEY,
      Accept: "application/x.jsonxbrl",
    },
  };
  return await axios
    .get(`https://ws.cbso.nbb.be/authentic//deposit/${referenceNumber}/accountingData`, config)
    .then((response) => response.data)
    .catch((e) => e.response.data);
};

export { getReferences, getReference, getAccountingData, getAccountingDataPdf };
