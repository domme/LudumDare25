using UnityEngine;
using System.Collections;

public class RotateContinous : MonoBehaviour {

    public Vector3 rotationAxis = Vector3.up;
    public float rotationSpeed = 0.005f;
    
	// Use this for initialization
	void Start () 
    {
	    
	}
	
	// Update is called once per frame
	void Update () 
    {
        transform.RotateAround(rotationAxis, rotationSpeed * Time.smoothDeltaTime);
	}
}
