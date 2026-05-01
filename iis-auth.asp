<%
Response.ContentType = "application/json"
Response.CacheControl = "no-cache"
Response.AddHeader "Pragma", "no-cache"
Response.Expires = -1

Function Normalize(value)
    If IsNull(value) Then
        Normalize = Null
        Exit Function
    End If

    Dim text
    text = Trim(CStr(value))
    If Len(text) = 0 Then
        Normalize = Null
    Else
        Normalize = text
    End If
End Function

Function JsonString(value)
    If IsNull(value) Then
        JsonString = "null"
        Exit Function
    End If

    Dim text
    text = CStr(value)
    text = Replace(text, "\", "\\")
    text = Replace(text, """", "\""")
    text = Replace(text, vbCrLf, "\n")
    text = Replace(text, vbCr, "\n")
    text = Replace(text, vbLf, "\n")
    JsonString = """" & text & """"
End Function

Dim logonUser, authUser, remoteUser, authType, userIdentityName, isAuthenticated, json
logonUser = Normalize(Request.ServerVariables("LOGON_USER"))
authUser = Normalize(Request.ServerVariables("AUTH_USER"))
remoteUser = Normalize(Request.ServerVariables("REMOTE_USER"))
authType = Normalize(Request.ServerVariables("AUTH_TYPE"))
userIdentityName = Normalize(Request.ServerVariables("LOGON_USER"))
isAuthenticated = "false"
If Not IsNull(userIdentityName) Then
    isAuthenticated = "true"
End If

json = "{""generatedAt"":" & JsonString(CStr(Now())) & _
    ",""source"":""iis-auth.asp""" & _
    ",""request"":{""isAuthenticated"":" & isAuthenticated & ",""path"":" & JsonString(Normalize(Request.ServerVariables("URL"))) & "}" & _
    ",""identity"":{""logonUser"":" & JsonString(logonUser) & ",""authUser"":" & JsonString(authUser) & ",""remoteUser"":" & JsonString(remoteUser) & ",""authType"":" & JsonString(authType) & ",""userIdentityName"":" & JsonString(userIdentityName) & "}" & _
    "}"

Response.Write json
%>
