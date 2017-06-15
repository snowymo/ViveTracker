using System.Collections;
using System.Collections.Generic;
using UnityEngine;

using System;
using System.IO;
using System.Runtime.InteropServices;

using System.Net;
using System.Net.Sockets;

public class UDPReceiver : MonoBehaviour
{
  [Serializable]
  private class ViveTrackerJSON
  {
    public string name;
    public float x;
    public float y;
    public float z;
    public float qw;
    public float qx;
    public float qy;
    public float qz;
  }

  public struct ViveTracker
  {
    public Vector3 pos;
    public Quaternion rot;
  }


  private const int UDP_PORT = 5015;
  private Vector3 DEFAULT_POS_VEC;
  private Quaternion DEFAULT_ROT_QUAT;
  private int nBytesReceived;
  private bool stopReceive;
  private IPEndPoint ipEndPoint;
  private System.Threading.Thread thread = null;
  private Socket socket;
  private byte[] b1;
  private byte[] b2;
  private byte[] b3;
  private MemoryStream b1ms;
  private MemoryStream b2ms;
  private float accum;
  private int nPackets;
  private int nFrames;

  private UnityEngine.Object lock_object;

  private long lastLoadedFrame;
  private byte[] lastLoadedBuffer;
  private MemoryStream lastLoadedBufferMS;

  private Dictionary<string, ViveTracker> viveTrackers;

  public void Start()
  {
    lock_object = new UnityEngine.Object();
    Application.runInBackground = true;
    Application.targetFrameRate = -1;
    DEFAULT_POS_VEC = new Vector3(0, 0, 0);
    DEFAULT_ROT_QUAT = new Quaternion(0, 0, 0, 0);
    accum = 0;
    nPackets = 0;
    nFrames = 0;
    // ~65KB buffer sizes
    b1 = new byte[65507];
    b2 = new byte[65507];
    b1ms = new MemoryStream(b1);
    b2ms = new MemoryStream(b2);
    viveTrackers = new Dictionary<string, ViveTracker>();
    thread = new System.Threading.Thread(ThreadRun);
    thread.Start();
  }
  // Handle new thread data / invoke Unity routines outside of the socket thread.
  public void Update()
  {
    accum += Time.deltaTime;
    float round_accum = (float)Math.Floor(accum);
    if (round_accum > 0)
    {
      accum -= round_accum;
      // print ("FPS: " + ((float)nFrames / round_accum).ToString());
      print("packets per second: " + ((float)nPackets / round_accum).ToString());
      nPackets = 0;
      nFrames = 0;
    }
    nFrames++;
  }

  public Vector3 GetViveTrackerPos(string name)
  {
    if (viveTrackers.ContainsKey(name)) {
      return viveTrackers[name].pos;
    }
    return DEFAULT_POS_VEC;
  }

  public Quaternion GetViveTrackerRot(string name)
  {
    if (viveTrackers.ContainsKey(name))
    {
      return viveTrackers[name].rot;
    }
    return DEFAULT_ROT_QUAT;
  }

  // This thread handles incoming NatNet packets.
  private void ThreadRun()
  {
    stopReceive = false;
    Socket socket = new Socket(AddressFamily.InterNetwork, SocketType.Dgram, ProtocolType.Udp);
    socket.SetSocketOption(SocketOptionLevel.Socket, SocketOptionName.ReuseAddress, true);
    ipEndPoint = new IPEndPoint(IPAddress.Any, UDP_PORT);
    Debug.Log("prebind");
    socket.Bind(ipEndPoint);
    Debug.Log("bind");
    MulticastOption mo = new MulticastOption(IPAddress.Parse("224.1.1.1"));
    socket.SetSocketOption(SocketOptionLevel.IP, SocketOptionName.AddMembership, mo);

    nBytesReceived = 0;
    lastLoadedBuffer = b1;
    lastLoadedBufferMS = b1ms;
    lastLoadedFrame = 0;

    byte[] newPacketBuffer = b2;
    MemoryStream newPacketBufferMS = b2ms;

    byte[] tempBuffer;
    MemoryStream tempBufferMS;

    while (true)
    {
      Debug.Log("preRECV");
      nBytesReceived = socket.Receive(newPacketBuffer);
      Debug.Log("RECV");
      nPackets++;
      newPacketBufferMS.Position = 0;

      string string_data = System.Text.Encoding.ASCII.GetString(newPacketBuffer);
      string_data = string_data.Substring(0, string_data.IndexOf('}')+1);
      try
      {
        ViveTrackerJSON viveTrackerJson = JsonUtility.FromJson<ViveTrackerJSON>(string_data);
        ViveTracker newTracker = new ViveTracker();
        newTracker.pos = new Vector3(viveTrackerJson.x, viveTrackerJson.y, viveTrackerJson.z);
        newTracker.rot = new Quaternion(viveTrackerJson.qx, viveTrackerJson.qy, viveTrackerJson.qz, viveTrackerJson.qw);
        viveTrackers[viveTrackerJson.name] = newTracker;
      } catch
      {
        Debug.Log("failed to decode message: " + string_data);
      }

      lastLoadedBufferMS.Position = 0;
      newPacketBufferMS.Position = 0;
      tempBuffer = lastLoadedBuffer;
      tempBufferMS = lastLoadedBufferMS;
      lastLoadedBuffer = newPacketBuffer;
      lastLoadedBufferMS = newPacketBufferMS;
      newPacketBuffer = tempBuffer;
      newPacketBufferMS = tempBufferMS;

      if (stopReceive)
      {
        break;
      }
    }
  }
  private void OnDestroy()
  {
    stopReceive = true;
  }
}
