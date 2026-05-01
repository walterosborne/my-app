<%@ Page Language="C#" %>
<%@ Import Namespace="System" %>
<%@ Import Namespace="System.Web" %>
<%@ Import Namespace="System.Web.Script.Serialization" %>

<script runat="server">
    private string Normalize(string value)
    {
        if (String.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        return value.Trim();
    }

    protected void Page_Load(object sender, EventArgs e)
    {
        Response.ContentType = "application/json";
        Response.Cache.SetCacheability(HttpCacheability.NoCache);
        Response.Cache.SetNoStore();
        Response.Cache.SetRevalidation(HttpCacheRevalidation.AllCaches);
        Response.Cache.SetExpires(DateTime.UtcNow.AddMinutes(-1));

        var payload = new
        {
            generatedAt = DateTime.UtcNow.ToString("o"),
            request = new
            {
                isAuthenticated = Request.IsAuthenticated,
                applicationPath = Request.ApplicationPath,
                path = Request.Path
            },
            identity = new
            {
                logonUser = Normalize(Request.ServerVariables["LOGON_USER"]),
                authUser = Normalize(Request.ServerVariables["AUTH_USER"]),
                remoteUser = Normalize(Request.ServerVariables["REMOTE_USER"]),
                authType = Normalize(Request.ServerVariables["AUTH_TYPE"]),
                userIdentityName = Normalize(Context?.User?.Identity?.Name)
            }
        };

        var serializer = new JavaScriptSerializer();
        Response.Write(serializer.Serialize(payload));
        Response.End();
    }
</script>
