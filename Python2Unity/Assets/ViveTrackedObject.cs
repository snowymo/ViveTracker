using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class ViveTrackedObject : MonoBehaviour {

  public string name;

  public UDPReceiver server;

	// Use this for initialization
	void Start () {
		
	}
	
	// Update is called once per frame
	void Update () {
    this.transform.position = server.GetViveTrackerPos(name);
    this.transform.rotation = server.GetViveTrackerRot(name);
  }
}
