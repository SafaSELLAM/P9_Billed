/**
 * @jest-environment jsdom
 */

import { screen, fireEvent, waitFor } from "@testing-library/dom"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import { localStorageMock } from "../__mocks__/localStorage.js";
import { ROUTES_PATH } from '../constants/routes.js'
import store from "../__mocks__/store.js";
import mockStore from "../__mocks__/store"
import { allowedTypes } from "../constants/allowedTypes.js";



describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    beforeEach(() => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const html = NewBillUI()
      document.body.innerHTML = html
    })

    test("Then form elements should appear", () => {
      expect(screen.getByTestId("form-new-bill")).toBeTruthy();
      expect(screen.getByTestId("file")).toBeTruthy();
      expect(screen.getByTestId("expense-type")).toBeTruthy();
      expect(screen.getByTestId("expense-name")).toBeTruthy();
      expect(screen.getByTestId("amount")).toBeTruthy();
      expect(screen.getByTestId("datepicker")).toBeTruthy();
      expect(screen.getByTestId("vat")).toBeTruthy();
      expect(screen.getByTestId("pct")).toBeTruthy();
      expect(screen.getByTestId("commentary")).toBeTruthy();
    })

    test("Then it should change files correctly", () => {
      const onNavigate = jest.fn();
      const newBillInstance = new NewBill({ document, onNavigate, store, localStorage: window.localStorage });

      const handleChangeFile = jest.fn(newBillInstance.handleChangeFile);
      const fileInput = screen.getByTestId("file");
      fileInput.addEventListener("change", handleChangeFile);

      allowedTypes.forEach(type => {
        const file = new File(["dummy content"], `test.${type.split('/')[1]}`, { type });
        fireEvent.change(fileInput, {
          target: {
            files: [file]
          }
        });
        expect(handleChangeFile).toHaveBeenCalled();
        expect(newBillInstance.fileUrl).toBeDefined();
        expect(newBillInstance.fileName).toBeDefined();
      });
    });

    test("Then it should handle form submission correctly", () => {
      const onNavigate = jest.fn();
      const newBillInstance = new NewBill({ document, onNavigate, store, localStorage: window.localStorage });

      const form = screen.getByTestId("form-new-bill");
      const handleSubmit = jest.fn(newBillInstance.handleSubmit);
      newBillInstance.fileUrl = "https://firebasestorage.googleapis.com/v0/b/billable-677b6.a…f-1.jpg?alt=media&token=c1640e12-a24b-4b11-ae52-529112e9602a";
      newBillInstance.fileName = "preview-facture-free-201801-pdf-1.jpg";

      form.addEventListener("submit", handleSubmit);
      fireEvent.submit(form);

      expect(handleSubmit).toHaveBeenCalled();
      expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH['Bills']);
    })
  })

})

//Test on NewBill's POST

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Add a bill from mock API POST", async () => {
      const spyOnMockstore = jest.spyOn(mockStore, "bills");
      const bill = {
        "id": "47qAXb6fIm2zOKkLzMro",
        "vat": "80",
        "fileUrl": "https://firebasestorage.googleapis.com/v0/b/billable-677b6.a…f-1.jpg?alt=media&token=c1640e12-a24b-4b11-ae52-529112e9602a",
        "status": "pending",
        "type": "Hôtel et logement",
        "commentary": "séminaire billed",
        "name": "encore",
        "fileName": "preview-facture-free-201801-pdf-1.jpg",
        "date": "2004-04-04",
        "amount": 400,
        "commentAdmin": "ok",
        "email": "a@a",
        "pct": 20
      };
      const billsToPost = await mockStore.bills().update(bill);
      expect(spyOnMockstore).toHaveBeenCalledTimes(1);
      expect(billsToPost).toStrictEqual(bill);
    });
    describe("When an error occurs on API", () => {
      beforeEach(() => {
        window.localStorage.setItem(
          "user",
          JSON.stringify({
            type: "Employee",
          })
        );

        document.body.innerHTML = NewBillUI();

        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        };
      });
      test("Fails to add a bill to the API error 404", async () => {
        const spyOnMockstore = jest.spyOn(console, "error");

        const store = {
          bills: jest.fn(() => newBill.store),
          create: jest.fn(() => Promise.resolve({})),
          update: jest.fn(() => Promise.reject(new Error("404"))),
        };
        const onNavigate = jest.fn();
        const newBill = new NewBill({ document, onNavigate, store, localStorage });
        newBill.correctFormat = true;

        const form = screen.getByTestId("form-new-bill");
        const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));
        form.addEventListener("submit", handleSubmit);

        fireEvent.submit(form);
        await new Promise(process.nextTick);
        expect(spyOnMockstore).toBeCalledWith(new Error("404"));
      });
      test("Fails to add bills to the API error", async () => {
        const spyOnMockstore = jest.spyOn(console, "error");

        const store = {
          bills: jest.fn(() => newBill.store),
          create: jest.fn(() => Promise.resolve({})),
          update: jest.fn(() => Promise.reject(new Error("500"))),
        };
        const onNavigate = jest.fn();
        const newBill = new NewBill({ document, onNavigate, store, localStorage });
        newBill.correctFormat = true;

        const form = screen.getByTestId("form-new-bill");
        const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));
        form.addEventListener("submit", handleSubmit);

        fireEvent.submit(form);
        await new Promise(process.nextTick);
        expect(spyOnMockstore).toBeCalledWith(new Error("500"));
      });
    });
  });
});