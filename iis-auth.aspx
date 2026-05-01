<%@ Page Language="C#" %>
<%@ Import Namespace="System" %>
<%@ Import Namespace="System.Web" %>

<script runat="server">
    private string Normalize(string value)
    {
        if (String.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        return value.Trim();
    }

    private string ToJsonString(string value)
    {
        if (value == null)
        {
            return "null";
        }

        return "\"" + HttpUtility.JavaScriptStringEncode(value) + "\"";
    }

    private string ToJsonBool(bool value)
    {
        return value ? "true" : "false";
    }

    protected void Page_Load(object sender, EventArgs e)
    {
        Response.Clear();
        Response.ContentType = "application/json";
        Response.Cache.SetCacheability(HttpCacheability.NoCache);
        Response.Cache.SetNoStore();
        Response.Cache.SetRevalidation(HttpCacheRevalidation.AllCaches);
        Response.Cache.SetExpires(DateTime.UtcNow.AddMinutes(-1));

        var logonUser = Normalize(Request.ServerVariables["LOGON_USER"]);
        var authUser = Normalize(Request.ServerVariables["AUTH_USER"]);
        var remoteUser = Normalize(Request.ServerVariables["REMOTE_USER"]);
        var authType = Normalize(Request.ServerVariables["AUTH_TYPE"]);
        var userIdentityName = Normalize(Context != null && Context.User != null && Context.User.Identity != null
            ? Context.User.Identity.Name
            : null);

        var json = "{"
            + "\"generatedAt\":" + ToJsonString(DateTime.UtcNow.ToString("o")) + ","
            + "\"source\":\"iis-auth.aspx\","
            + "\"request\":{"
                + "\"isAuthenticated\":" + ToJsonBool(Request.IsAuthenticated) + ","
                + "\"applicationPath\":" + ToJsonString(Normalize(Request.ApplicationPath)) + ","
                + "\"path\":" + ToJsonString(Normalize(Request.Path))
            + "},"
            + "\"identity\":{"
                + "\"logonUser\":" + ToJsonString(logonUser) + ","
                + "\"authUser\":" + ToJsonString(authUser) + ","
                + "\"remoteUser\":" + ToJsonString(remoteUser) + ","
                + "\"authType\":" + ToJsonString(authType) + ","
                + "\"userIdentityName\":" + ToJsonString(userIdentityName)
            + "}"
        + "}";

        Response.Write(json);
        Context.ApplicationInstance.CompleteRequest();
    }
</script>
