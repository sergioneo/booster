import React, { Component } from 'react'
import Web3 from 'web3'
import './App.css' 
import { STORE_CODE, STICKER_TOKEN_ADDRESS, STICKER_STORE_ADDRESS, STICKER_TOKEN_ABI, STICKER_STORE_ABI } from './config'
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link
} from "react-router-dom";
import { useParams } from "react-router";

class App extends Component {
  intervalID

  componentDidMount() {
    this.loadBlockchainData()
  }

  componentWillUnmount() {
    /*
      stop getData() from continuing to run even
      after unmounting this component. Notice we are calling
      'clearTimeout()` here rather than `clearInterval()` as
      in the previous example.
    */
    clearTimeout(this.intervalID)
  }

  async loadBlockchainData() {
    window.ethereum.enable()
    const web3 = new Web3(Web3.givenProvider || "http://localhost:7545")
    const accounts = await web3.eth.getAccounts()
    this.setState({ account: accounts[0] })
    const stickers = new web3.eth.Contract(STICKER_TOKEN_ABI, STICKER_TOKEN_ADDRESS)
    this.setState({ stickers })
    const stickerStore = new web3.eth.Contract(STICKER_STORE_ABI, STICKER_STORE_ADDRESS)
    this.setState({ stickerStore })
    const inventory = await stickers.methods.getMyStickers(accounts[0]).call()
    this.setState({ inventory })
    const wrappedBooster = await stickerStore.methods.availableBooster(STORE_CODE, accounts[0]).call()
    this.setState({ wrappedBooster })
    if (wrappedBooster != 0) {
      const wrappedBoosterStatus = await stickerStore.methods.boosterStatus(STORE_CODE, wrappedBooster).call()
      this.setState({ wrappedBoosterStatus })
    } else {
      this.state.wrappedBoosterStatus = false
    }
    const listingObj = await stickerStore.methods.listedCollections(STORE_CODE).call()
    console.log("boosterPrice")
    const boosterPrice = listingObj.boosterPrice
    this.setState({ boosterPrice })
    this.intervalID = setTimeout(this.loadBlockchainData.bind(this), 2000);
  }

  constructor(props) {
    super(props)
    this.state = { account: '', inventory: [], wrappedBoosterStatus: false, wrappedBooster: 0 }
  }

  buyBooster() {
    this.setState({ loading: true })
    this.state.stickerStore.methods.orderBoosterPack().send({ from: this.state.account, value: this.state.boosterPrice })
    .once('receipt', (receipt) => {
      this.setState({ loading: false })
    })
  }

  unwrapBooster() {
    this.setState({ loading: true})
    this.state.stickerStore.methods.unwrapBooster().send({from: this.state.account})
    .once("receipt", (receipt) => {
      this.setState({ loading: false })
    })
  }

  render() {
    return (
      <div>
        <Router>
          <div>
            <nav>
              <ul>
                <li>
                  <Link to="/">Home</Link>
                </li>
                <li>
                  <Link to="/store">Store</Link>
                </li>
              </ul>
            </nav>

            {/* A <Switch> looks through its children <Route>s and
                renders the first one that matches the current URL. */}
            <Switch>
              <Route path="/store">
                <Store 
                  wrappedBooster = {this.state.wrappedBooster} 
                  buyBooster = {this.buyBooster.bind(this)}
                  unwrapBooster = {this.unwrapBooster.bind(this)}
                  wrappedBoosterStatus = {this.state.wrappedBoosterStatus}
                  boosterPrice = {this.state.boosterPrice}
                />
              </Route>
              <Route path="/:id">
                <Item inventory={this.state.inventory}/>
              </Route>
              <Route path="/">
                <Home inventory={this.state.inventory}/>
              </Route>
            </Switch>
          </div>
        </Router>
      </div>
    );
  }
}

export default App;

function Home(props) {
  return (
    <div>
      <div className="container-fluid">
        <h1>My Collection</h1>
        { props.inventory.map((amount, stickerN) => {
          return(
            <div key={stickerN}>
              <label>
                <Link to={"/"+(stickerN + 1)}>{stickerN + 1}</Link>: {amount}
              </label>
            </div>
          )
        })}
      </div>
    </div>
  );
}

function Store(props) {
  return (
    <div> 
      <h2>Tienda</h2>
      Booster price: {props.boosterPrice}
      <br></br>
      <button onClick={(event) => {
        event.preventDefault()
        props.buyBooster()
      }}>Comprar Sobre</button>
      <br></br>
      {props.wrappedBooster != 0 &&
        <div>
        Wrapped booster: {props.wrappedBooster}
        <br></br>
        wrapped Booster Status: {props.wrappedBoosterStatus ? "Ready" : "Preparing"}
        <br></br>
        <button onClick={(event) => {
          event.preventDefault()
          props.unwrapBooster()
        }}>Abrir Sobre</button>
        </div>
      }
    </div>
  );
}

function Item(props) {
  let { id } = useParams();

  return (
    <div>
      <h3>ID: {id}</h3>
      {props.inventory[id - 1] > 0 &&
        <h4>You have it</h4>
      }
      {props.inventory[id - 1] == 0 &&
        <h4>You don't have it</h4>
      }
      
    </div>
  );
}