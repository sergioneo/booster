import React, { useState, Component } from 'react'
import Web3 from 'web3'
import './App.css'
import { STORE_CODE, STICKER_TOKEN_ADDRESS, STICKER_STORE_ADDRESS, STICKER_TOKEN_ABI, STICKER_STORE_ABI, IPFS_GATEWAY } from './config'
import {
  HashRouter as Router,
  Switch,
  Route,
  Link
} from "react-router-dom";
import { useParams } from "react-router";
import Button from 'react-bootstrap/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'


class App extends Component {
  intervalID

  componentDidMount() {
    // Just for the sake of the demo, let's preload all images
    const images = [
      IPFS_GATEWAY+"QmSW7ELBsHadiSvb4NfMUpMGvaztY6rEWjDv8NKSXiRseH/images/1.png",
      IPFS_GATEWAY+"QmSW7ELBsHadiSvb4NfMUpMGvaztY6rEWjDv8NKSXiRseH/images/2.png",
      IPFS_GATEWAY+"QmSW7ELBsHadiSvb4NfMUpMGvaztY6rEWjDv8NKSXiRseH/images/3.png",
      IPFS_GATEWAY+"QmSW7ELBsHadiSvb4NfMUpMGvaztY6rEWjDv8NKSXiRseH/images/4.png",
      IPFS_GATEWAY+"QmSW7ELBsHadiSvb4NfMUpMGvaztY6rEWjDv8NKSXiRseH/images/5.png",
      IPFS_GATEWAY+"QmSW7ELBsHadiSvb4NfMUpMGvaztY6rEWjDv8NKSXiRseH/images/6.png",
      IPFS_GATEWAY+"QmSW7ELBsHadiSvb4NfMUpMGvaztY6rEWjDv8NKSXiRseH/images/7.png",
      IPFS_GATEWAY+"QmSW7ELBsHadiSvb4NfMUpMGvaztY6rEWjDv8NKSXiRseH/images/8.png",
      IPFS_GATEWAY+"QmSW7ELBsHadiSvb4NfMUpMGvaztY6rEWjDv8NKSXiRseH/images/9.png",
      IPFS_GATEWAY+"QmSW7ELBsHadiSvb4NfMUpMGvaztY6rEWjDv8NKSXiRseH/images/10.png",
      IPFS_GATEWAY+"QmX7sugwV644Pxo9izaj4kSGvXEqbtAL3WZ3ey3o8d9iah/bw-images/1.png",
      IPFS_GATEWAY+"QmX7sugwV644Pxo9izaj4kSGvXEqbtAL3WZ3ey3o8d9iah/bw-images/2.png",
      IPFS_GATEWAY+"QmX7sugwV644Pxo9izaj4kSGvXEqbtAL3WZ3ey3o8d9iah/bw-images/3.png",
      IPFS_GATEWAY+"QmX7sugwV644Pxo9izaj4kSGvXEqbtAL3WZ3ey3o8d9iah/bw-images/4.png",
      IPFS_GATEWAY+"QmX7sugwV644Pxo9izaj4kSGvXEqbtAL3WZ3ey3o8d9iah/bw-images/5.png",
      IPFS_GATEWAY+"QmX7sugwV644Pxo9izaj4kSGvXEqbtAL3WZ3ey3o8d9iah/bw-images/6.png",
      IPFS_GATEWAY+"QmX7sugwV644Pxo9izaj4kSGvXEqbtAL3WZ3ey3o8d9iah/bw-images/7.png",
      IPFS_GATEWAY+"QmX7sugwV644Pxo9izaj4kSGvXEqbtAL3WZ3ey3o8d9iah/bw-images/8.png",
      IPFS_GATEWAY+"QmX7sugwV644Pxo9izaj4kSGvXEqbtAL3WZ3ey3o8d9iah/bw-images/9.png",
      IPFS_GATEWAY+"QmX7sugwV644Pxo9izaj4kSGvXEqbtAL3WZ3ey3o8d9iah/bw-images/10.png"
    ]
    images.forEach((picture) => {
        const img = new Image();
        img.src = picture;
    });

    this.loadBlockchainData()
    this.loadMetadata()
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
    const inventory = await stickers.methods.getItems(accounts[0]).call()
    this.setState({ inventory })
    const wrappedBooster = await stickerStore.methods.availableBooster(STORE_CODE, accounts[0]).call()
    this.setState({ wrappedBooster })
    if (wrappedBooster != 0) {
      const wrappedBoosterStatus = await stickerStore.methods.boosterStatus(STORE_CODE, wrappedBooster).call()
      this.setState({ wrappedBoosterStatus })
    }
    const listingObj = await stickerStore.methods.listedCollections(STORE_CODE).call()
    const boosterPrice = listingObj.boosterPrice
    this.setState({ boosterPrice })
    this.intervalID = setTimeout(this.loadBlockchainData.bind(this), 2000);
  }

  async loadMetadata() {
    // we only need to do this one once if the stickers are there
    if (this.state.inventory.length == 0)
      setTimeout(this.loadMetadata.bind(this), 3000);
    var metadataLib = this.state.metadata;
    for (var i = 0; i < this.state.inventory.length; i++) {
      var metadataForToken = await this.state.stickers.methods.uri(i+1).call().then(function(r) {
        var metadata = {
          "uri": r.replace("{id}", i+1)
        }
        metadataLib[i] = metadata;
      })
    }
    this.fetchMetadata();
  }

  async fetchMetadata() {
    var metadataLib = this.state.metadata;
    for(var key = 0; key < metadataLib.length; key++) {
      if(metadataLib[key]["uri"] != null){
        fetch(IPFS_GATEWAY+""+metadataLib[key]["uri"])
        .then(response => response.json())
        .then((jsonData) => {
          // jsonData is parsed json object received from url

          metadataLib[jsonData.id - 1] = {
            ...jsonData,
            ...metadataLib[jsonData.id-1]
          }
          this.setState({metadata: metadataLib})
        })
        .catch((error) => {
          // handle your errors here
          console.error(error)
        })
      }
    }
  }

  constructor(props) {
    super(props)
    this.state = { account: '', inventory: [], wrappedBoosterStatus: false, wrappedBooster: 0, metadata: [{},{},{},{},{},{},{},{},{},{}] }
  }

  buyBooster() {
    this.setState({ loading: true })
    this.state.stickerStore.methods.buyBooster(STORE_CODE).send({ from: this.state.account, value: this.state.boosterPrice })
    .once('receipt', (receipt) => {
      this.setState({ loading: false })
    })
  }

  openBooster() {
    this.setState({ loading: true})
    this.state.stickerStore.methods.openBooster(STORE_CODE).send({from: this.state.account})
    .once("receipt", (receipt) => {
      this.setState({ loading: false })
    })
  }

  render() {
    return (
      <div className="overlay">
        <Router>
          <Link to="/" className="logo">CRYPTO EMBLEMS</Link>
          <div>

            {/* A <Switch> looks through its children <Route>s and
                renders the first one that matches the current URL. */}
            <Switch>
              <Route path="/store">
                <Store
                  wrappedBooster = {this.state.wrappedBooster}
                  buyBooster = {this.buyBooster.bind(this)}
                  openBooster = {this.openBooster.bind(this)}
                  wrappedBoosterStatus = {this.state.wrappedBoosterStatus}
                  boosterPrice = {this.state.boosterPrice}
                />
              </Route>
              <Route path="/:id">
                <Item inventory={this.state.inventory} metadata={this.state.metadata}/>
              </Route>
              <Route path="/">
                <Home inventory={this.state.inventory} metadata={this.state.metadata} />
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
  const items = []
  for(var i = 0; i < props.metadata.length; i++) {
    if (props.metadata[i].image != null) {
      const img = parseInt(props.inventory[i], 10) > 0 ?
        <img className="emblem-sm-img" src={IPFS_GATEWAY+"" + props.metadata[i].image} /> :
        <img className="emblem-sm-img" src={IPFS_GATEWAY+"" + props.metadata[i]["bw-image"]} />;
      items.push(
        <div key={i} className="emblem-sm">
          <Link to={"/"+(i+1)}>
            {img}
          </Link>
        </div>)
    }
  }
  if (items.length < 10) {
    return(<div className="home"><p>Loading...</p></div>)
  }
  return (
    <div className="home">
      <div className="container-fluid">
        {items.slice(0, 5)}<br></br>
        {items.slice(5, 10)}
      </div>
      <Link to="/store">
        <Button variant="warning">Purchase a Crate</Button>
      </Link>
    </div>
  );
}

function Store(props) {
  if (props.wrappedBooster == 0) {
    return (
    <div className="store">
      <h2>Crate Store</h2>
      <h4>Crate price: Ξ {props.boosterPrice/10e17}</h4>
      <br></br>
      <Button variant="warning" onClick={(event) => {
        event.preventDefault()
        props.buyBooster()
      }}>Place Order</Button>
    </div>
  );
  } else if (!props.wrappedBoosterStatus) {
    return (
      <div className="store">
        <h2>Crate Store</h2>
        <p>Your crate is being prepared, hang tight!</p>
      </div>
    );
  } else {
    return (
      <div className="store">
        <h2>Crate Store</h2>
        <p>Your crate is ready to be opened!</p>
        <Button variant="success" onClick={(event) => {
          event.preventDefault()
          props.openBooster()
        }}>Open Crate</Button>
      </div>
    );
  }
}

function Item(props) {
  let { id } = useParams();
  var data = props.metadata[id - 1];
  var items = parseInt(props.inventory[id - 1], 10);
  var hasIt = items > 0;
  var next = id == 10? 1: parseInt(id, 10) + 1;
  var prev = id == 1 ? 10 : parseInt(id, 10) - 1;
  var word = items == 1 ? "copy": "copies";
  var imageUrl = hasIt ?
    IPFS_GATEWAY+"" + data.image :
    IPFS_GATEWAY+"" + data["bw-image"];
  return (
    <div className="detail">
      <h3>{hasIt ? data.name : "?????????"}</h3>
      <img src={imageUrl} className="emblem-lg-img" />
      {hasIt &&
        <div>
          <p>{data.description}</p>
          <h4>You have {items} {word}.</h4>
        </div>
      }
      {!hasIt &&
         <div>
          <p>???????????????????????</p>
          <h4>You don't have any copies.</h4>
        </div>
      }
      <Link to={"/"+prev}>Previous</Link> - <Link to={"/"+next}>Next</Link>
    </div>
  );
}
