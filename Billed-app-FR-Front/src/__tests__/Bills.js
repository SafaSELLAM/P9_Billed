/**
 * @jest-environment jsdom
 */

import { screen, waitFor, fireEvent } from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import Bills from "../containers/Bills.js"
import { ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import router from "../app/Router.js";
import store from "../__mocks__/store.js";

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      //to-do write expect expression
      expect(windowIcon.classList.contains('active-icon')).toBe(true)
    })
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => new Date(b.date) - new Date(a.date)
      //problème antichrono 
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })
  })
})




describe("Given I am connected as an employee", () => {
  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', { value: localStorageMock })
    window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }))
    const root = document.createElement("div")
    root.setAttribute("id", "root")
    document.body.append(root)
    router()
  })

  describe("When I am on Bills Page", () => {
    describe("When I click on the New Bill button", () => {
      test("Then it should navigate to New Bill Page", () => {
        const billsInstance = new Bills({ document, onNavigate: window.onNavigate, store: null, localStorage: window.localStorage })
        const handleClickNewBill = jest.fn(billsInstance.handleClickNewBill)
        const buttonNewBill = screen.getByTestId('btn-new-bill')
        buttonNewBill.addEventListener('click', handleClickNewBill)
        fireEvent.click(buttonNewBill)
        expect(handleClickNewBill).toHaveBeenCalled()
        expect(window.location.hash).toBe(ROUTES_PATH['NewBill'])

      })
    })
    describe("When I click on an eye icon", () => {
      test("Then a modal should open", async () => {
        document.body.innerHTML = BillsUI({ data: bills })
        const billsInstance = new Bills({ document, onNavigate: window.onNavigate, store: null, localStorage: window.localStorage })
        const iconEye = screen.getAllByTestId('icon-eye')[0]
        const handleClickIconEye = jest.fn(() => billsInstance.handleClickIconEye(iconEye))
        $.fn.modal = jest.fn()

        iconEye.addEventListener('click', handleClickIconEye)
        fireEvent.click(iconEye)

        expect(handleClickIconEye).toHaveBeenCalled()
        expect($.fn.modal).toHaveBeenCalledWith('show')
      })
    })

    describe("When I fetch bills from mock API", () => {

      test("Then it should return an array with bills", async () => {
        const billsInstance = new Bills({ document, onNavigate: window.onNavigate, store, localStorage: window.localStorage })
        const fetchedBills = await billsInstance.getBills()
        expect(fetchedBills.length).toBe(4)
      })
      test("Fails to fetch bills from API 404 error ", async () => {
        store.bills = jest.fn().mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 404"))
            }
          }
        })
        document.body.innerHTML = BillsUI({ error: "Erreur 404" })
        const message = await screen.getByText(/Erreur 404/)
        expect(message).toBeTruthy()
      })
      test("fetches messages from an API and fails with 500 message error", async () => {

        store.bills = jest.fn().mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 500"))
            }
          }
        })
        document.body.innerHTML = BillsUI({ error: "Erreur 500" })
        const message = await screen.getByText(/Erreur 500/)
        expect(message).toBeTruthy()
      })

    })


  })
})
